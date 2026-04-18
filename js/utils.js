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
    if (!input || typeof input !== 'string') return [];

    const lines = input.trim().split('\n');
    const seenTexts = new Set(); // Track duplicates

    return lines
        .map((line) => {
            // Skip empty or whitespace-only lines
            if (!line || !line.trim()) return null;

            // Remove various numbering formats:
            // "1. Task", "1) Task", "1] Task", "1: Task"
            // "- Task", "* Task", "• Task"
            let text = line.replace(/^[\s]*[\d]*[\.\)\]:]{0,1}[\s]*[\-\*•]?[\s]+/, '').trim();

            // Fallback: if line doesn't have numbering, just trim
            if (text === line.trim()) {
                text = line.trim();
            }

            // Final cleanup
            text = text.replace(/^\s+|\s+$/g, '').trim();

            return text.length > 0 ? { originalText: text } : null;
        })
        .filter(t => t !== null)
        .filter((task) => {
            // Remove duplicates (case-insensitive, normalized)
            const normalized = task.originalText.toLowerCase().trim();
            if (seenTexts.has(normalized)) {
                return false;
            }
            seenTexts.add(normalized);
            return true;
        })
        .map((task, idx) => {
            const enhancedTask = enhanceTaskData(task.originalText);
            return {
                id: idx,
                text: task.originalText,
                ...enhancedTask
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

    // Check for completion markers at start: ✅, [x], [X], ☑, ✓, ~text~
    if (/^[\s]*[\[✓✅☑]|^\s*\[x\]|^\s*\[X\]|^~/.test(cleanText)) {
        completed = true;
        // Remove completion markers from any position
        cleanText = cleanText
            .replace(/^\s*[\[✓✅☑]/, '')
            .replace(/^\s*\[x\]/i, '')
            .replace(/^[\s~]+/, '')
            .replace(/~\s*$/, '')
            .trim();
    }

    // Extract duration patterns: "30min", "1h", "(30)", "[30min]", etc.
    const durationMatch = cleanText.match(/\((\d+)(?:\s*(?:min|m|h|hour))?\)|(\d+)\s*(min|minute|minutes|h|hour|hours|m)(?:\s|$)/i);
    if (durationMatch) {
        const value = parseInt(durationMatch[1] || durationMatch[2]);
        const unit = (durationMatch[3] || 'min').toLowerCase();
        duration = (unit.startsWith('h') || unit === 'hour') ? value * 60 : value;
        cleanText = cleanText.replace(durationMatch[0], '').trim();
    }

    // Extract emoji from start (single emoji character)
    const emojiMatch = cleanText.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}])\s*/u);
    if (emojiMatch) {
        emoji = emojiMatch[1];
        cleanText = cleanText.replace(emojiMatch[0], '').trim();
    }

    // Detect priority from keywords (handle variations)
    if (/^!+\s|urgent|critical|asap|!!!|highest|top priority/i.test(cleanText)) {
        priority = 'High';
        emoji = emoji === '📝' ? '🔴' : emoji;
        cleanText = cleanText.replace(/^!+\s*/, '').trim();
    } else if (/\(high\)|\[high\]|high.*priority|\bhigh\b/i.test(cleanText)) {
        priority = 'High';
        emoji = emoji === '📝' ? '🔴' : emoji;
    } else if (/\(medium\)|\[medium\]|medium.*priority|\bmedium\b/i.test(cleanText)) {
        priority = 'Medium';
    } else if (/\(low\)|\[low\]|low.*priority|\blow\b/i.test(cleanText)) {
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
 * Save task list to localStorage
 * @param {string} name - Name to save the list under
 * @param {Array} tasks - Array of task objects
 */
function saveTaskList(name, tasks) {
    if (!name || name.trim() === '') return false;

    try {
        const normalizedName = name.trim();
        const savedLists = JSON.parse(localStorage.getItem('savedTaskLists') || '{}');
        savedLists[normalizedName] = {
            name: normalizedName,
            tasks: tasks.map(t => t.text), // Save as simple text array for simplicity
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('savedTaskLists', JSON.stringify(savedLists));
        return true;
    } catch (e) {
        console.error('Failed to save task list:', e);
        return false;
    }
}

/**
 * Load task list from localStorage
 * @param {string} name - Name of the saved list
 * @returns {Array|null} Array of task texts or null if not found
 */
function loadTaskList(name) {
    try {
        const savedLists = JSON.parse(localStorage.getItem('savedTaskLists') || '{}');
        const list = savedLists[name];
        return list ? list.tasks : null;
    } catch (e) {
        console.error('Failed to load task list:', e);
        return null;
    }
}

/**
 * Get all saved task lists
 * @returns {Object} Dictionary of {listName: {name, savedAt, taskCount}}
 */
function getSavedTaskLists() {
    try {
        const savedLists = JSON.parse(localStorage.getItem('savedTaskLists') || '{}');
        const result = {};
        for (const [key, value] of Object.entries(savedLists)) {
            result[key] = {
                name: value.name,
                taskCount: value.tasks ? value.tasks.length : 0,
                savedAt: value.savedAt
            };
        }
        return result;
    } catch (e) {
        console.error('Failed to get saved task lists:', e);
        return {};
    }
}

/**
 * Delete a saved task list
 * @param {string} name - Name of the list to delete
 * @returns {boolean} True if deleted successfully
 */
function deleteTaskList(name) {
    try {
        const savedLists = JSON.parse(localStorage.getItem('savedTaskLists') || '{}');
        if (savedLists[name]) {
            delete savedLists[name];
            localStorage.setItem('savedTaskLists', JSON.stringify(savedLists));
            return true;
        }
        return false;
    } catch (e) {
        console.error('Failed to delete task list:', e);
        return false;
    }
}

/**
 * Save current app parameters to localStorage
 */
function saveAppState(params) {
    try {
        localStorage.setItem('appState', JSON.stringify({
            parameters: params,
            savedAt: new Date().toISOString()
        }));
    } catch (e) {
        console.error('Failed to save app state:', e);
    }
}

/**
 * Export optimized schedule in Markdown format
 */
function exportMarkdown(tasks, optimizedOrder, result) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    let md = `# 📋 Optimized Task Schedule\n\n`;
    md += `**Generated:** ${date} at ${time}\n\n`;

    if (result && result.improvementPercent) {
        md += `## ✨ Optimization Results\n\n`;
        md += `- **Route Improvement:** ${result.improvementPercent.toFixed(1)}%\n`;
        md += `- **Distance Improved:** ${(result.improvement || 0).toFixed(1)} units\n`;
        md += `- **Iterations:** ${result.iterations}\n`;
        md += `- **Ants Used:** ${result.numAnts}\n\n`;
    }

    md += `## 📝 Your Optimized Order\n\n`;

    if (optimizedOrder && optimizedOrder.length > 0) {
        optimizedOrder.forEach((taskIdx, idx) => {
            const task = tasks[taskIdx];
            const displayText = task.displayText || task.text;
            const duration = task.duration ? ` ⏱️ ${task.duration}min` : '';
            const priority = task.priority && task.priority !== 'Medium' ? ` 🏷️ ${task.priority}` : '';
            md += `${idx + 1}. ${displayText}${duration}${priority}\n`;
        });
    } else {
        tasks.forEach((task, idx) => {
            const displayText = task.displayText || task.text;
            const duration = task.duration ? ` ⏱️ ${task.duration}min` : '';
            const priority = task.priority && task.priority !== 'Medium' ? ` 🏷️ ${task.priority}` : '';
            md += `${idx + 1}. ${displayText}${duration}${priority}\n`;
        });
    }

    md += `\n## 💭 Algorithm Info\n\n`;
    md += `This schedule was optimized using Ant Colony Optimization (ACO), a swarm intelligence algorithm inspired by ant foraging behavior.\n`;

    return md;
}

/**
 * Export optimized schedule in JSON format
 */
function exportJSON(tasks, optimizedOrder, result) {
    const schedule = {
        exportedAt: new Date().toISOString(),
        optimization: {
            algorithm: 'Ant Colony Optimization',
            improvementPercent: result ? result.improvementPercent : 0,
            iterations: result ? result.iterations : 0,
            antsUsed: result ? result.numAnts : 0
        },
        tasks: tasks.map((task, idx) => ({
            id: idx,
            text: task.text,
            displayText: task.displayText || task.text,
            priority: task.priority || 'Medium',
            duration: task.duration || null,
            emoji: task.emoji || '📝'
        })),
        optimizedOrder: optimizedOrder && optimizedOrder.length > 0
            ? optimizedOrder.map((taskIdx, order) => ({
                order: order + 1,
                taskId: taskIdx,
                task: tasks[taskIdx].displayText || tasks[taskIdx].text
            }))
            : tasks.map((task, idx) => ({
                order: idx + 1,
                taskId: idx,
                task: task.displayText || task.text
            }))
    };

    return JSON.stringify(schedule, null, 2);
}

/**
 * Export optimized schedule in iCal format (basic)
 */
function exportiCal(tasks, optimizedOrder, result) {
    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Ant To-Do List//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Optimized Task Schedule
X-WR-TIMEZONE:UTC
`;

    const startDate = new Date();
    const schedule = optimizedOrder && optimizedOrder.length > 0
        ? optimizedOrder.map((taskIdx, order) => ({ order, taskIdx }))
        : tasks.map((_, taskIdx) => ({ order: taskIdx, taskIdx }));

    schedule.forEach(({ order, taskIdx }) => {
        const task = tasks[taskIdx];
        const displayText = task.displayText || task.text;
        const duration = task.duration || 60; // Default 60 minutes

        // Create event start/end times
        const eventStart = new Date(startDate);
        eventStart.setMinutes(eventStart.getMinutes() + (order * duration));

        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventEnd.getMinutes() + duration);

        const formatICalDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
        };

        ical += `BEGIN:VEVENT
UID:task-${taskIdx}@anttodo
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(eventStart)}
DTEND:${formatICalDate(eventEnd)}
SUMMARY:${displayText}
DESCRIPTION:Priority: ${task.priority}
STATUS:TODO
END:VEVENT
`;
    });

    ical += `END:VCALENDAR`;
    return ical;
}

/**
 * Download file with given content
 */
function downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
