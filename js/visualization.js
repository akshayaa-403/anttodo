/**
 * ============================================================================
 * VISUALIZATION.JS - Canvas Rendering & Animation
 * ============================================================================
 * Handles real-time visualization of:
 * - Task nodes with labels
 * - Pheromone trails (dynamic thickness & color)
 * - Animated ants moving along edges (using requestAnimationFrame)
 * - Grid background (ant colony aesthetic)
 * - Final path visualization (all ants marching + confetti)
 */

class VisualizationEngine {
    /**
     * Initialize visualization
     * @param {HTMLCanvasElement} canvas - Canvas DOM element
     * @param {Object} positions - Task positions {taskId: {x, y}}
     * @param {number} taskCount - Number of tasks
     * @param {Array} tasks - Task list for node labels
     */
    constructor(canvas, positions, taskCount, tasks = []) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.positions = positions;
        this.taskCount = taskCount;
        this.tasks = tasks;

        // Set canvas size to fill its container
        this.resize();

        // Visualization state
        this.pheromones = null;
        this.ants = [];
        this.animatedAnts = [];  // Ants being animated on canvas
        this.bestTour = null;
        this.isOptimizing = false;
        this.showFinalPath = false;
        this.animationProgress = 0;
        this.marchingAntsTime = 0;  // For continuous marching ants animation

        // Color scheme
        this.colors = {
            background: '#0a0f0d',
            grid: 'rgba(45, 106, 79, 0.15)',
            node: '#2d6a4f',
            nodeText: '#e8ebe9',
            pheromoneMin: 'rgba(45, 106, 79, 0.3)',
            pheromoneMax: '#d97706',
            ant: '🐜',
            trail: 'rgba(217, 119, 6, 0.6)',
        };

        // Listen for resize (store reference for cleanup)
        this.resizeListener = () => this.resize();
        window.addEventListener('resize', this.resizeListener);

        // Start animation loop
        this.animationFrameId = null;
        this.startAnimationLoop();
    }

    /**
     * Resize canvas to fit container
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;

        // Redraw static elements (fixed typo: this.positions not this.position)
        if (this.positions) {
            this.draw();
        }
    }

    /**
     * Start continuous animation loop
     */
    startAnimationLoop() {
        const animate = () => {
            this.draw();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Stop animation loop and cleanup event listeners
     */
    stopAnimationLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Cleanup all resources (call before destroying visualization)
     */
    cleanup() {
        this.stopAnimationLoop();
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
    }

    /**
     * MAIN DRAW FUNCTION
     * Renders all elements on canvas
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Update animation timer for marching ants
        this.marchingAntsTime += 1;

        // Draw grid background
        this.drawGrid();

        // Draw edges between all tasks
        this.drawEdges();

        // Draw pheromone trails (if available)
        if (this.pheromones) {
            this.drawPheromoneTrails();
            // Draw marching ants along trails during optimization
            if (this.ants && this.ants.length > 0) {
                this.drawMarchingAnts();
            }
        }

        // Draw task nodes
        this.drawNodes();

        // Draw animated ants
        this.drawAnimatedAnts();

        // If final path, draw with special effects
        if (this.showFinalPath && this.bestTour) {
            this.drawFinalPath();
        }
    }

    /**
     * Draw subtle grid background (ant colony aesthetic)
     */
    drawGrid() {
        const gridSize = 40;
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw light edges between all task nodes
     */
    drawEdges() {
        // Draw regular edges (not part of best path)
        this.ctx.strokeStyle = 'rgba(45, 106, 79, 0.15)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.taskCount; i++) {
            for (let j = i + 1; j < this.taskCount; j++) {
                if (!this.isBestPathEdge(i, j)) {
                    const p1 = this.positions[i];
                    const p2 = this.positions[j];

                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw best path edges (highlighted)
        this.drawBestPathEdges();
    }

    /**
     * Check if edge is part of best path
     */
    isBestPathEdge(i, j) {
        if (!this.bestTour || this.bestTour.length < 2) return false;
        
        for (let k = 0; k < this.bestTour.length - 1; k++) {
            const from = this.bestTour[k];
            const to = this.bestTour[k + 1];
            if ((from === i && to === j) || (from === j && to === i)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Draw best path edges with highlighting and arrows
     */
    drawBestPathEdges() {
        if (!this.bestTour || this.bestTour.length < 2) return;

        // Draw glowing best path
        this.ctx.strokeStyle = 'rgba(217, 119, 6, 0.8)';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'rgba(217, 119, 6, 0.6)';
        this.ctx.shadowBlur = 12;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let k = 0; k < this.bestTour.length - 1; k++) {
            const fromIdx = this.bestTour[k];
            const toIdx = this.bestTour[k + 1];
            const p1 = this.positions[fromIdx];
            const p2 = this.positions[toIdx];

            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();

            // Draw arrow
            this.drawArrow(p1, p2);
        }

        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw arrow on an edge
     */
    drawArrow(from, to) {
        const headlen = 15;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        // Position arrow at 60% along the line
        const t = 0.6;
        const arrowX = from.x + (to.x - from.x) * t;
        const arrowY = from.y + (to.y - from.y) * t;

        // Arrow head colors
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(arrowX - headlen * Math.cos(angle - Math.PI / 6), arrowY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(arrowX - headlen * Math.cos(angle + Math.PI / 6), arrowY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Draw pheromone trails with dynamic thickness and color
     * Thickness ∝ pheromone level
     * Color: green (low) → orange (high)
     */
    drawPheromoneTrails() {
        if (!this.pheromones) return;

        // Find min and max pheromone for normalization
        let minPher = Infinity, maxPher = -Infinity;
        for (let i = 0; i < this.taskCount; i++) {
            for (let j = 0; j < this.taskCount; j++) {
                minPher = Math.min(minPher, this.pheromones[i][j]);
                maxPher = Math.max(maxPher, this.pheromones[i][j]);
            }
        }

        // Draw trails
        for (let i = 0; i < this.taskCount; i++) {
            for (let j = i + 1; j < this.taskCount; j++) {
                const pheromone = this.pheromones[i][j];
                const normalized = (pheromone - minPher) / (maxPher - minPher + 0.0001);

                // Thickness based on pheromone level
                const lineWidth = 1 + normalized * 8;

                // Color gradient: green → orange
                const color = interpolateColor('#2d6a4f', '#d97706', normalized);

                // Draw trail
                const p1 = this.positions[i];
                const p2 = this.positions[j];

                this.ctx.save(); // Save context state
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = lineWidth;
                this.ctx.globalAlpha = 0.6 + normalized * 0.4;
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
                this.ctx.restore(); // Restore context state
            }
        }
    }

    /**
     * Draw marching ants animation along pheromone trails
     * Animated dashes move continuously along high-pheromone paths
     */
    drawMarchingAnts() {
        if (!this.pheromones) return;

        // Find min and max pheromone for normalization
        let minPher = Infinity, maxPher = -Infinity;
        for (let i = 0; i < this.taskCount; i++) {
            for (let j = 0; j < this.taskCount; j++) {
                minPher = Math.min(minPher, this.pheromones[i][j]);
                maxPher = Math.max(maxPher, this.pheromones[i][j]);
            }
        }

        const dashLength = 8;
        const spacing = 16;
        const animationSpeed = 4;

        // Draw marching ants on high-pheromone trails
        for (let i = 0; i < this.taskCount; i++) {
            for (let j = i + 1; j < this.taskCount; j++) {
                const pheromone = this.pheromones[i][j];
                const normalized = (pheromone - minPher) / (maxPher - minPher + 0.0001);

                // Only draw marching ants on trails with significant pheromone
                if (normalized < 0.3) continue;

                const p1 = this.positions[i];
                const p2 = this.positions[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const unitX = dx / distance;
                const unitY = dy / distance;

                // Calculate animation offset
                const offset = (this.marchingAntsTime * animationSpeed) % (spacing + dashLength);

                // Draw marching ants along the trail
                let currentDist = offset - spacing;
                while (currentDist < distance) {
                    if (currentDist + dashLength > 0) {
                        const startDist = Math.max(0, currentDist);
                        const endDist = Math.min(distance, currentDist + dashLength);

                        const x1 = p1.x + unitX * startDist;
                        const y1 = p1.y + unitY * startDist;
                        const x2 = p1.x + unitX * endDist;
                        const y2 = p1.y + unitY * endDist;

                        // Color intensity based on pheromone level
                        const intensity = 0.3 + normalized * 0.7;
                        this.ctx.strokeStyle = `rgba(217, 119, 6, ${intensity})`;
                        this.ctx.lineWidth = 2 + normalized * 3;
                        this.ctx.lineCap = 'round';

                        this.ctx.beginPath();
                        this.ctx.moveTo(x1, y1);
                        this.ctx.lineTo(x2, y2);
                        this.ctx.stroke();
                    }

                    currentDist += spacing + dashLength;
                }
            }
        }
    }

    /**
     * Draw task nodes (circles with labels)
     */
    drawNodes() {
        const nodeRadius = 20;

        for (let i = 0; i < this.taskCount; i++) {
            const pos = this.positions[i];

            // Draw circle
            this.ctx.fillStyle = this.colors.node;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw border
            this.ctx.strokeStyle = '#4f9d6d';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw task name or number
            const task = this.tasks[i];
            const label = task ? (task.displayText || task.text).substring(0, 8) : (i + 1).toString();
            
            this.ctx.fillStyle = this.colors.nodeText;
            this.ctx.font = 'bold 9px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, pos.x, pos.y);
        }
    }

    /**
     * Draw animated ants along their current edges
     * Each ant has a position that animates smoothly
     */
    drawAnimatedAnts() {
        // Update animated ants positions (smooth interpolation)
        for (let aAnt of this.animatedAnts) {
            aAnt.update();
            this.drawAnt(aAnt.x, aAnt.y, aAnt.rotation);
        }
    }

    /**
     * Draw a single ant emoji at position
     */
    drawAnt(x, y, rotation = 0) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        // Use canvas text rendering for emoji
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🐜', 0, 0);

        this.ctx.restore();
    }

    /**
     * Draw final optimized path with all ants marching
     */
    drawFinalPath() {
        if (!this.bestTour || this.bestTour.length === 0) return;

        // Animate progress
        this.animationProgress = Math.min(1, this.animationProgress + 0.02);

        // Draw glowing trail
        const lineWidth = 4 + Math.sin(this.animationProgress * Math.PI * 2) * 2;
        this.ctx.strokeStyle = 'rgba(217, 119, 6, 0.8)';
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        const pathLength = this.bestTour.length;
        for (let i = 0; i < pathLength - 1; i++) {
            const from = this.positions[this.bestTour[i]];
            const to = this.positions[this.bestTour[i + 1]];

            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.stroke();
        }

        // March ants along final path
        for (let i = 0; i < 8; i++) {
            const offset = (this.animationProgress + i / 8) % 1;
            const edgeIdx = Math.floor(offset * (pathLength - 1));
            const edgeProgress = (offset * (pathLength - 1)) % 1;

            const from = this.positions[this.bestTour[edgeIdx]];
            const to = this.positions[this.bestTour[edgeIdx + 1]];

            const x = from.x + (to.x - from.x) * edgeProgress;
            const y = from.y + (to.y - from.y) * edgeProgress;

            this.drawAnt(x, y, Math.atan2(to.y - from.y, to.x - from.x));
        }

        // Draw confetti-like pheromone burst around endpoints
        if (this.animationProgress > 0.5) {
            const burst = (this.animationProgress - 0.5) * 2;
            for (let i = 0; i < 3; i++) {
                const pos = this.positions[this.bestTour[i]];
                this.drawPheromoneBurst(pos, burst);
            }
        }
    }

    /**
     * Draw pheromone burst effect (confetti-like)
     */
    drawPheromoneBurst(center, intensity) {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = intensity * 40;
            const x = center.x + Math.cos(angle) * distance;
            const y = center.y + Math.sin(angle) * distance;

            const size = 4 * (1 - intensity);
            this.ctx.fillStyle = `rgba(217, 119, 6, ${0.8 * (1 - intensity)})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Update visualization with current state from ACO
     * @param {Object} state - { ants, pheromones, bestTour, bestLength }
     */
    updateState(state) {
        this.ants = state.ants || [];
        this.pheromones = state.pheromones;
        this.bestTour = state.bestTour;

        // Create animated ants (sample a few for visualization)
        this.createAnimatedAnts();
    }

    /**
     * Create animated ant objects that move smoothly on canvas
     * Sample some ants for performance
     */
    createAnimatedAnts() {
        const maxVisibleAnts = 12;
        const sampleSize = Math.min(maxVisibleAnts, this.ants.length);
        const step = Math.floor(this.ants.length / sampleSize);

        this.animatedAnts = [];

        for (let i = 0; i < sampleSize; i++) {
            const antIdx = i * step;
            const ant = this.ants[antIdx];

            if (ant && ant.path && ant.path.length > 0) {
                const aAnt = new AnimatedAnt(ant, this.positions);
                this.animatedAnts.push(aAnt);
            }
        }
    }

    /**
     * Show final optimization complete state
     */
    showFinalPathAnimation() {
        this.showFinalPath = true;
        this.animationProgress = 0;
    }

    /**
     * Reset visualization
     */
    reset() {
        this.pheromones = null;
        this.ants = [];
        this.animatedAnts = [];
        this.bestTour = null;
        this.isOptimizing = false;
        this.showFinalPath = false;
        this.animationProgress = 0;
        this.marchingAntsTime = 0;
        this.draw();
    }

    /**
     * Display message on canvas
     */
    displayMessage(message) {
        const canvasMessage = document.getElementById('canvasMessage');
        if (canvasMessage) {
            canvasMessage.innerHTML = message;
        }
    }
}

/**
 * AnimatedAnt - Single ant moving along its tour path
 * Interpolates smoothly between waypoints
 */
class AnimatedAnt {
    constructor(antData, positions) {
        this.ant = antData;
        this.positions = positions;
        this.currentEdgeIdx = 0;
        this.edgeProgress = 0;
        this.speedFactor = 0.01 + Math.random() * 0.02; // Slight speed variation

        this.x = 0;
        this.y = 0;
        this.rotation = 0;

        this.update();
    }

    /**
     * Update ant position along tour
     */
    update() {
        const path = this.ant.path;
        if (!path || path.length === 0) return;

        // Move along path edges
        this.edgeProgress += this.speedFactor;

        // If reached end of current edge, move to next
        if (this.edgeProgress >= 1) {
            this.edgeProgress = 0;
            this.currentEdgeIdx = (this.currentEdgeIdx + 1) % path.length;
        }

        // Get current edge
        const edge = path[this.currentEdgeIdx];
        const fromPos = this.positions[edge.from];
        const toPos = this.positions[edge.to];

        // Interpolate position
        if (fromPos && toPos) {
            this.x = fromPos.x + (toPos.x - fromPos.x) * this.edgeProgress;
            this.y = fromPos.y + (toPos.y - fromPos.y) * this.edgeProgress;

            // Calculate rotation towards destination
            this.rotation = Math.atan2(
                toPos.y - fromPos.y,
                toPos.x - fromPos.x
            );
        }
    }
}
