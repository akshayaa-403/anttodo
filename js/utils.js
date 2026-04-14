/**
 * ============================================================================
 * UTILS.JS - Utility Functions
 * ============================================================================
 * Helpers for:
 * - Euclidean distance calculations
 * - Text truncation and formatting
 * - Seeded random number generation (for reproducible positions)
 * - Task parsing from textarea
 * - Array operations (shuffle, nearest neighbor heuristic)
 */

/**
 * Parse tasks from textarea input
 * Handles numbered lists, bullet points, or plain lines
 * Returns array of {id, text, emoji, priority, duration, completed}
 */
function parseTasks(input) {
    const lines = input.trim().split('\n');
    return lines
        .map((line, idx) => {
            // Remove numbering: "1. Task" -> "Task", "- Task" -> "Task"
            let text = line.replace(/^[\d\-\*].[\s]?/, '').trim();
            // Remove leading/trailing whitespace
            text = text.replace(/^\s+|\s+$/g, '').trim();
            return text.length > 0 ? { id: idx, text } : null;
        })
        .filter(t => t !== null)
        .map((task, idx) => {
            const enhancedTask = enhanceTaskData(task.text);
            return {
                ...task,
                ...enhancedTask,
                id: idx // Re-index after filtering
            };
        });
}

/**
 * Extract metadata from task text
 * Detects: priority, emoji, duration, completed status
 */
function enhanceTaskData(text) {
    // Default values
    let priority = 'Medium';
    let emoji = '📝';
    let duration = null;
    let completed = false;
    let cleanText = text;

    // Check for completion markers
    if (text.includes('✓') || text.includes('✅') || text.startsWith('[x]') || text.startsWith('☑')) {
        completed = true;
        cleanText = cleanText.replace(/^[✓✅☑\[x\]]\s*/, '').trim();
    }

    // Extract duration patterns: "30min", "1h", "(30)", etc.
    const durationMatch = cleanText.match(/(\d+)\s*(min|hour|h|m)/i);
    if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        duration = unit.startsWith('h') ? value * 60 : value;
        cleanText = cleanText.replace(durationMatch[0], '').trim();
    }

    // Extract emoji from start
    const emojiMatch = cleanText.match(/^[\p{Emoji}]\s*/u);
    if (emojiMatch) {
        emoji = emojiMatch[0].trim();
        cleanText = cleanText.replace(emojiMatch[0], '').trim();
    }

    // Detect priority from keywords
    if (cleanText.match(/urgent|critical|asap|!!!/i) || cleanText.startsWith('!')) {
        priority = 'High';
        emoji = emoji === '📝' ? '🔴' : emoji;
        cleanText = cleanText.replace(/^!+\s*/, '').trim();
    } else if (cleanText.match(/\(high\)|\[high\]|high.*priority/i)) {
        priority = 'High';
        emoji = emoji === '📝' ? '🔴' : emoji;
    } else if (cleanText.match(/\(medium\)|\[medium\]|medium.*priority/i)) {
        priority = 'Medium';
    } else if (cleanText.match(/\(low\)|\[low\]|low.*priority/i)) {
        priority = 'Low';
        emoji = emoji === '📝' ? '🟢' : emoji;
    }

    return {
        emoji,
        priority,
        duration,
        completed,
        displayText: cleanText
    };
}

/**
 * Validate task count
 * Returns: { valid: bool, warning: string }
 */
function validateTaskCount(tasks) {
    if (tasks.length < 3) {
        return { valid: false, warning: 'Need at least 3 tasks to optimize!' };
    }
    if (tasks.length > 20) {
        return { valid: false, warning: 'Limiting to 20 tasks (ACO can handle more, but gets slow)' };
    }
    return { valid: true, warning: '' };
}

/**
 * Seeded Random Number Generator (PRNG)
 * Same seed always produces same sequence of random numbers
 * Uses Mulberry32 algorithm for quick, deterministic randomness
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
        this.state = seed;
    }

    next() {
        // Mulberry32 algorithm
        let x = this.state;
        x |= 0;
        x = x + 0x6d2b79f5 | 0;
        let t = Math.imul(x ^ (x >>> 15), 1 | x);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        this.state = ((t ^ (t >>> 14)) >>> 0);
        return (this.state >>> 0) / 4294967296;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

/**
 * Generate random 2D coordinates for tasks (seeded)
 * Positions are deterministic based on task count
 * Spread across a canvas-like area: [0, width] x [0, height]
 */
function generateTaskPositions(numTasks, width = 800, height = 600) {
    // Use task count as seed for reproducibility
    const rng = new SeededRandom(numTasks * 12345);

    // Generate positions with some padding and clustering
    const padding = 50;
    const usableWidth = width - 2 * padding;
    const usableHeight = height - 2 * padding;

    const positions = {};
    for (let i = 0; i < numTasks; i++) {
        positions[i] = {
            x: padding + rng.next() * usableWidth,
            y: padding + rng.next() * usableHeight
        };
    }

    return positions;
}

/**
 * Euclidean distance between two 2D points
 */
function euclideanDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Build distance matrix from task positions
 * Returns 2D array: distMatrix[i][j] = distance from task i to task j
 */
function buildDistanceMatrix(positions, taskCount) {
    const matrix = [];
    for (let i = 0; i < taskCount; i++) {
        matrix[i] = [];
        for (let j = 0; j < taskCount; j++) {
            if (i === j) {
                matrix[i][j] = 0;
            } else {
                matrix[i][j] = euclideanDistance(positions[i], positions[j]);
            }
        }
    }
    return matrix;
}

/**
 * Calculate nearest-neighbor tour length
 * Start from node 0, always go to nearest unvisited node
 * Used to initialize pheromone trails
 */
function nearestNeighborTour(distMatrix, taskCount) {
    const visited = new Array(taskCount).fill(false);
    let current = 0;
    visited[current] = true;
    let length = 0;
    const tour = [current];

    for (let step = 1; step < taskCount; step++) {
        let nearest = -1;
        let minDist = Infinity;

        // Find closest unvisited node
        for (let j = 0; j < taskCount; j++) {
            if (!visited[j] && distMatrix[current][j] < minDist) {
                minDist = distMatrix[current][j];
                nearest = j;
            }
        }

        current = nearest;
        visited[current] = true;
        tour.push(current);
        length += minDist;
    }

    return { length, tour };
}

/**
 * Calculate total tour length (sum of edge distances)
 * tour is an array of task indices in order
 */
function calculateTourLength(tour, distMatrix) {
    let length = 0;
    for (let i = 0; i < tour.length - 1; i++) {
        length += distMatrix[tour[i]][tour[i + 1]];
    }
    return length;
}

/**
 * Truncate text to maximum length with ellipsis
 */
function truncateText(text, maxLength = 20) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 1) + '…';
}

/**
 * Format percentage with fixed decimals
 */
function formatPercentage(value, decimals = 1) {
    return (value * 100).toFixed(decimals) + '%';
}

/**
 * Fisher-Yates shuffle (mutates array in place)
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Deep copy of 2D array (for pheromone matrix)
 */
function deepCopy2D(matrix) {
    return matrix.map(row => [...row]);
}

/**
 * Linear interpolation between two values
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Sleep utility (used for forced loading animation)
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Map value from one range to another
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Interpolate color between two hex colors
 * Returns RGB object or CSS string
 */
function interpolateColor(color1, color2, t) {
    // Parse hex colors
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);

    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);

    const r = Math.round(lerp(r1, r2, t));
    const g = Math.round(lerp(g1, g2, t));
    const b = Math.round(lerp(b1, b2, t));

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate random color in a range
 */
function randomColor(hueMin = 0, hueMax = 360) {
    const hue = Math.random() * (hueMax - hueMin) + hueMin;
    const saturation = 70 + Math.random() * 20;
    const lightness = 50 + Math.random() * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
