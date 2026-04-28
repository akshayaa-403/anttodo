/**
 * Ant Colony Optimization Visualization Module
 * @module visualization
 * Performance optimized with:
 * - Frame rate throttling (60 FPS cap)
 * - Dirty rectangle rendering
 * - Pheromone min/max caching
 * - Position interpolation smoothing
 * - Batch edge drawing
 */

import { CONFIG } from './config.js';

class AntVisualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d');
        
        if (!this.canvas || !this.ctx) {
            console.error('Canvas not found or context not available');
            return;
        }
        
        // Core state
        this.tasks = [];
        this.tour = [];
        this.ants = [];
        this.pheromones = [];
        this.bestTour = null;
        this.bestDistance = Infinity;
        this.isAnimating = false;
        this.animationFrameId = null;
        
        // Performance optimization caches
        this.pheromoneMinMaxCache = { min: 1.0, max: 1.0, iteration: -1 };
        this.lastRenderTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.isTabVisible = true;
        
        // Dirty rectangle tracking
        this.dirtyRects = [];
        this.lastAntPositions = new Map(); // antId -> {x, y}
        
        // Animation timing
        this.lastTimestamp = 0;
        this.frameInterval = CONFIG.PERFORMANCE.FRAME_INTERVAL_MS;
        
        // Tab visibility handling
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Resize handling with debounce
        this.resizeTimeout = null;
        window.addEventListener('resize', () => this.handleResize());
        
        // Initialize canvas
        this.initCanvas();
    }
    
    /**
     * Initialize canvas with proper sizing
     */
    initCanvas() {
        if (!this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Set up context for antialiasing if enabled
        if (CONFIG.PERFORMANCE.CANVAS_ANTIALIAS) {
            this.ctx.imageSmoothingEnabled = true;
        }
    }
    
    /**
     * Handle resize with debounce to prevent excessive recalculations
     */
    handleResize() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.initCanvas();
            if (this.tasks.length > 0) {
                this.renderFull(); // Full render after resize
            }
        }, 150);
    }
    
    /**
     * Handle tab visibility - throttle rendering when not visible
     */
    handleVisibilityChange() {
        this.isTabVisible = !document.hidden;
        if (!this.isTabVisible && this.animationFrameId) {
            // Tab is hidden - we can still animate but at lower FPS
            // The frame throttler will handle this
            if (CONFIG.DEBUG.LOG_SLOW_OPERATIONS) {
                console.log('Tab hidden - reducing animation priority');
            }
        }
    }
    
    /**
     * Update cached pheromone min/max (expensive operation, do sparingly)
     * @param {number} currentIteration - Current ACO iteration
     */
    updatePheromoneCache(currentIteration) {
        if (!CONFIG.PERFORMANCE.CACHE_PHEROMONE_MINMAX) {
            return this.calculatePheromoneMinMax();
        }
        
        // Only update every N iterations
        const shouldUpdate = currentIteration === -1 || 
            this.pheromoneMinMaxCache.iteration === -1 ||
            currentIteration - this.pheromoneMinMaxCache.iteration >= CONFIG.PERFORMANCE.PHEROMONE_CACHE_UPDATE_INTERVAL;
        
        if (shouldUpdate || !this.pheromoneMinMaxCache.min) {
            const { min, max } = this.calculatePheromoneMinMax();
            this.pheromoneMinMaxCache = {
                min: min,
                max: max,
                iteration: currentIteration
            };
        }
        
        return this.pheromoneMinMaxCache;
    }
    
    /**
     * Calculate actual min/max pheromone values
     * @returns {Object} {min, max}
     */
    calculatePheromoneMinMax() {
        if (!this.pheromones.length || !this.pheromones[0]?.length) {
            return { min: 1.0, max: 1.0 };
        }
        
        let min = Infinity;
        let max = -Infinity;
        
        // Single pass O(n²) calculation
        for (let i = 0; i < this.pheromones.length; i++) {
            for (let j = 0; j < this.pheromones[i].length; j++) {
                const val = this.pheromones[i][j];
                if (val < min) min = val;
                if (val > max) max = val;
            }
        }
        
        return {
            min: min === Infinity ? 1.0 : min,
            max: max === -Infinity ? 1.0 : max
        };
    }
    
    /**
     * Draw pheromone trails with intensity-based colors
     * @param {number} currentIteration - Current iteration for cache
     */
    drawPheromones(currentIteration = -1) {
        if (!this.ctx || !this.pheromones.length || !this.tasks.length) return;
        
        const startTime = performance.now();
        const { min, max } = this.updatePheromoneCache(currentIteration);
        
        // Early exit if no variation
        if (min === max) {
            this.drawEdgesUniform();
        } else {
            this.drawEdgesIntensityBased(min, max);
        }
        
        // Log slow operations
        if (CONFIG.DEBUG.LOG_SLOW_OPERATIONS) {
            const elapsed = performance.now() - startTime;
            if (elapsed > CONFIG.DEBUG.SLOW_OPERATION_THRESHOLD_MS) {
                console.warn(`Slow pheromone draw: ${elapsed.toFixed(2)}ms`);
            }
        }
    }
    
    /**
     * Draw all edges with uniform color (faster)
     */
    drawEdgesUniform() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.lineWidth = 1.5;
        
        for (let i = 0; i < this.tasks.length; i++) {
            for (let j = i + 1; j < this.tasks.length; j++) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.tasks[i].x, this.tasks[i].y);
                this.ctx.lineTo(this.tasks[j].x, this.tasks[j].y);
                this.ctx.strokeStyle = CONFIG.COLORS.PHEROMONE_LOW || '#4fc3f7';
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
    }
    
    /**
     * Draw edges with intensity-based colors (slower but prettier)
     * @param {number} min - Minimum pheromone value
     * @param {number} max - Maximum pheromone value
     */
    drawEdgesIntensityBased(min, max) {
        this.ctx.save();
        const range = max - min;
        
        // Batch drawing for performance
        const edges = [];
        for (let i = 0; i < this.tasks.length; i++) {
            for (let j = i + 1; j < this.tasks.length; j++) {
                const intensity = range > 0 ? (this.pheromones[i][j] - min) / range : 0.5;
                edges.push({ i, j, intensity });
            }
        }
        
        // Sort by intensity (optional - for visual layering, but skip for performance)
        // Instead, draw in batches
        const batchSize = CONFIG.PERFORMANCE.MAX_EDGES_PER_FRAME;
        const drawBatch = (startIdx) => {
            const endIdx = Math.min(startIdx + batchSize, edges.length);
            for (let k = startIdx; k < endIdx; k++) {
                const { i, j, intensity } = edges[k];
                this.ctx.beginPath();
                this.ctx.moveTo(this.tasks[i].x, this.tasks[i].y);
                this.ctx.lineTo(this.tasks[j].x, this.tasks[j].y);
                
                // Color based on intensity
                const hue = 200 - intensity * 100; // Blue to cyan range
                this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.2 + intensity * 0.6})`;
                this.ctx.lineWidth = 1 + intensity * 3;
                this.ctx.stroke();
            }
            
            if (endIdx < edges.length) {
                requestAnimationFrame(() => drawBatch(endIdx));
            }
        };
        
        drawBatch(0);
        this.ctx.restore();
    }
    
    /**
     * Draw ants with smooth interpolation
     * @param {number} timestamp - Current animation timestamp
     */
    drawAnts(timestamp) {
        if (!this.ctx || !this.ants.length) return;
        
        const startTime = performance.now();
        
        for (const ant of this.ants) {
            if (!ant.position) continue;
            
            // Calculate position on edge based on progress
            const progress = (timestamp * ant.speed) % 1;
            
            // Get current edge
            const fromIdx = Math.floor(ant.currentEdge);
            const toIdx = (fromIdx + 1) % ant.tour.length;
            
            const from = this.tasks[ant.tour[fromIdx]];
            const to = this.tasks[ant.tour[toIdx]];
            
            if (!from || !to) continue;
            
            // Cubic bezier for smooth movement
            const t = progress;
            const eased = this.easeInOutCubic(t);
            
            const x = from.x + (to.x - from.x) * eased;
            const y = from.y + (to.y - from.y) * eased;
            
            // Track dirty rects for partial redraws
            if (CONFIG.PERFORMANCE.ENABLE_DIRTY_RECTS) {
                const lastPos = this.lastAntPositions.get(ant.id);
                if (lastPos) {
                    this.dirtyRects.push({
                        x: Math.min(lastPos.x, x) - CONFIG.PERFORMANCE.DIRTY_RECT_PADDING,
                        y: Math.min(lastPos.y, y) - CONFIG.PERFORMANCE.DIRTY_RECT_PADDING,
                        w: Math.abs(lastPos.x - x) + CONFIG.PERFORMANCE.DIRTY_RECT_PADDING * 2,
                        h: Math.abs(lastPos.y - y) + CONFIG.PERFORMANCE.DIRTY_RECT_PADDING * 2
                    });
                }
                this.lastAntPositions.set(ant.id, { x, y });
            }
            
            // Draw ant body
            this.ctx.save();
            this.ctx.shadowBlur = 0; // Disable shadows for performance
            
            // Ant body (tiny circle)
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = ant.isBest ? '#ff9800' : CONFIG.COLORS.ANT || '#e91e63';
            this.ctx.fill();
            
            // Direction indicator (tiny line)
            const angle = Math.atan2(to.y - from.y, to.x - from.x);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(
                x + Math.cos(angle) * 6,
                y + Math.sin(angle) * 6
            );
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        // Render dirty rects
        if (CONFIG.PERFORMANCE.ENABLE_DIRTY_RECTS && this.dirtyRects.length) {
            this.renderDirtyRects();
        }
        
        // Log slow operations
        if (CONFIG.DEBUG.LOG_SLOW_OPERATIONS) {
            const elapsed = performance.now() - startTime;
            if (elapsed > CONFIG.DEBUG.SLOW_OPERATION_THRESHOLD_MS) {
                console.warn(`Slow ant draw (${this.ants.length} ants): ${elapsed.toFixed(2)}ms`);
            }
        }
    }
    
    /**
     * Render only dirty rectangles for performance
     */
    renderDirtyRects() {
        // Merge overlapping dirty rects to reduce draw calls
        const merged = this.mergeRects(this.dirtyRects);
        
        for (const rect of merged) {
            // Clip to canvas bounds
            const clipRect = {
                x: Math.max(0, rect.x),
                y: Math.max(0, rect.y),
                w: Math.min(this.canvas.width - rect.x, rect.w),
                h: Math.min(this.canvas.height - rect.y, rect.h)
            };
            
            if (clipRect.w > 0 && clipRect.h > 0) {
                // Save and restore only the clipped region
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.rect(clipRect.x, clipRect.y, clipRect.w, clipRect.h);
                this.ctx.clip();
                
                // Redraw this region
                this.renderRegion(clipRect);
                
                this.ctx.restore();
            }
        }
        
        this.dirtyRects = [];
    }
    
    /**
     * Merge overlapping rectangles for efficient redraw
     * @param {Array} rects - List of rectangles
     * @returns {Array} Merged rectangles
     */
    mergeRects(rects) {
        if (rects.length <= 1) return rects;
        
        const sorted = [...rects].sort((a, b) => a.x - b.x || a.y - b.y);
        const merged = [];
        let current = sorted[0];
        
        for (let i = 1; i < sorted.length; i++) {
            const next = sorted[i];
            const overlapX = current.x + current.w >= next.x;
            const overlapY = current.y + current.h >= next.y;
            
            if (overlapX && overlapY) {
                // Merge
                current = {
                    x: Math.min(current.x, next.x),
                    y: Math.min(current.y, next.y),
                    w: Math.max(current.x + current.w, next.x + next.w) - Math.min(current.x, next.x),
                    h: Math.max(current.y + current.h, next.y + next.h) - Math.min(current.y, next.y)
                };
            } else {
                merged.push(current);
                current = next;
            }
        }
        merged.push(current);
        
        return merged;
    }
    
    /**
     * Render a specific region of the canvas
     * @param {Object} rect - Region to render
     */
    renderRegion(rect) {
        // Simplified region render - redraws entire canvas but clipped
        // For true partial redraw, you'd need to maintain layer caches
        this.renderFull();
    }
    
    /**
     * Full canvas render (fallback for dirty rects)
     */
    renderFull() {
        if (!this.ctx || !this.tasks.length) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawPheromones();
        this.drawTasks();
        this.drawBestTour();
        if (this.isAnimating) {
            this.drawAnts(performance.now());
        }
    }
    
    /**
     * Draw tasks (nodes)
     */
    drawTasks() {
        if (!this.ctx) return;
        
        for (let i = 0; i < this.tasks.length; i++) {
            const task = this.tasks[i];
            
            // Node circle
            this.ctx.beginPath();
            this.ctx.arc(task.x, task.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = CONFIG.COLORS.NODE || '#4285f4';
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Task label (index)
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(i + 1, task.x, task.y);
        }
    }
    
    /**
     * Draw the best tour found so far
     */
    drawBestTour() {
        if (!this.ctx || !this.bestTour || this.bestTour.length < 2) return;
        
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(this.tasks[this.bestTour[0]].x, this.tasks[this.bestTour[0]].y);
        
        for (let i = 1; i < this.bestTour.length; i++) {
            const task = this.tasks[this.bestTour[i]];
            this.ctx.lineTo(task.x, task.y);
        }
        
        // Close the tour (return to start)
        const firstTask = this.tasks[this.bestTour[0]];
        this.ctx.lineTo(firstTask.x, firstTask.y);
        
        this.ctx.strokeStyle = CONFIG.COLORS.BEST_TOUR || '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }
    
    /**
     * Easing function for smooth ant movement
     * @param {number} t - Progress (0-1)
     * @returns {number} Eased value
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Animation loop with frame rate throttling
     * @param {number} timestamp - Current timestamp
     */
    animate(timestamp) {
        if (!this.isAnimating) return;
        
        // Throttle frame rate based on tab visibility
        let targetInterval = this.frameInterval;
        if (!this.isTabVisible && CONFIG.PERFORMANCE.THROTTLE_RENDER_ON_BACKGROUND) {
            targetInterval = 1000 / CONFIG.PERFORMANCE.BACKGROUND_FPS_CAP;
        }
        
        const elapsed = timestamp - this.lastRenderTime;
        
        if (elapsed >= targetInterval) {
            this.lastRenderTime = timestamp - (elapsed % targetInterval);
            
            // Update FPS counter
            this.frameCount++;
            if (timestamp - this.lastTimestamp >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTimestamp = timestamp;
                
                if (CONFIG.DEBUG.SHOW_FPS_COUNTER) {
                    console.log(`FPS: ${this.fps}`);
                }
            }
            
            // Only render if something changed
            if (this.shouldRender()) {
                this.renderPartial();
            }
        }
        
        this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
    }
    
    /**
     * Determine if rendering is needed
     * @returns {boolean}
     */
    shouldRender() {
        // Always render if ants are moving or tour changed
        return this.isAnimating || this.tourChanged;
    }
    
    /**
     * Partial render (optimized)
     */
    renderPartial() {
        if (!this.ctx) return;
        
        // Clear only necessary area
        if (CONFIG.PERFORMANCE.ENABLE_DIRTY_RECTS && this.dirtyRects.length) {
            this.renderDirtyRects();
        } else {
            this.clearCanvas();
            this.drawPheromones(-1);
            this.drawTasks();
            this.drawBestTour();
            if (this.isAnimating) {
                this.drawAnts(performance.now());
            }
        }
    }
    
    /**
     * Clear canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Start animation
     */
    startAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.lastRenderTime = 0;
        this.lastTimestamp = 0;
        this.frameCount = 0;
        this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
    }
    
    /**
     * Stop animation
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Update visualization data
     * @param {Object} data - New visualization data
     */
    updateData(data) {
        this.tasks = data.tasks || this.tasks;
        this.tour = data.tour || this.tour;
        this.ants = data.ants || this.ants;
        this.pheromones = data.pheromones || this.pheromones;
        this.bestTour = data.bestTour || this.bestTour;
        this.bestDistance = data.bestDistance ?? this.bestDistance;
        
        // Invalidate caches when data changes significantly
        if (data.pheromones) {
            this.pheromoneMinMaxCache.iteration = -1;
        }
        if (data.ants) {
            this.lastAntPositions.clear();
        }
        
        if (!this.isAnimating && data.ants?.length) {
            this.startAnimation();
        }
        
        this.renderFull();
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        this.stopAnimation();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('resize', this.handleResize);
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.lastAntPositions.clear();
        this.dirtyRects = [];
    }
}

export default AntVisualization;