/**
 * ============================================================================
 * ACO.JS - Ant Colony Optimization Algorithm
 * ============================================================================
 * Implements classic Ant System (AS) for Traveling Salesman Problem (TSP)
 * 
 * Algorithm Overview:
 * 1. Initialize pheromone trails based on nearest-neighbor heuristic
 * 2. For each iteration:
 *    a. Each ant constructs a solution probabilistically based on pheromones & heuristics
 *    b. Evaluate each ant's tour quality
 *    c. Update pheromone trails globally (evaporate + elitist best deposit)
 * 3. Return best tour found
 */

class AntColonyOptimizer {
    /**
     * Initialize Ant Colony Optimizer with ACO parameters
     * 
     * The ACO algorithm simulates the collective behavior of ants to solve TSP.
     * Ants deposit pheromone on good paths, creating positive feedback that guides
     * the colony toward better solutions. Over iterations, pheromone accumulates
     * on shorter tours, and evaporates from longer ones.
     * 
     * @param {number} taskCount - Number of tasks (vertices in TSP)
     * @param {Array<Array<number>>} distMatrix - Distance matrix [i][j] between all task pairs
     * @param {Object} [params={}] - Configuration parameters
     * @param {number} [params.numAnts=25] - Number of ants exploring solutions (more = slower but better coverage)
     * @param {number} [params.numIterations=80] - Number of algorithm iterations
     * @param {number} [params.alpha=1.0] - Pheromone importance weight (τ^α in selection)
     * @param {number} [params.beta=5.0] - Heuristic importance weight (η^β in selection, higher = greedier)
     * @param {number} [params.rho=0.15] - Pheromone evaporation rate (0-1, higher = more forgetting)
     * @param {number} [params.Q=200] - Pheromone deposit constant (higher = stronger reinforcement)
     * 
     * @example
     * const optimizer = new AntColonyOptimizer(
     *   5,
     *   distMatrix,
     *   { numAnts: 30, numIterations: 100, alpha: 1.2, beta: 4.0 }
     * );
     */
    constructor(taskCount, distMatrix, params = {}) {
        this.taskCount = taskCount;
        this.distMatrix = distMatrix;

        // Algorithm Parameters (with sensible defaults)
        this.numAnts = params.numAnts || 25;
        this.numIterations = params.numIterations || 80;
        this.alpha = params.alpha || 1.0;          // pheromone importance
        this.beta = params.beta || 5.0;            // heuristic importance
        this.rho = params.rho || 0.15;             // evaporation rate
        this.Q = params.Q || 200;                  // pheromone deposit constant

        // Initialization
        this.initializePheromones();

        // State tracking
        this.bestTour = null;
        this.bestLength = Infinity;
        this.ants = this.initializeAnts();
        this.iterationHistory = [];
    }

    /**
     * Initialize pheromone trails with heuristically informed values
     * 
     * Initial pheromone level τ₀ = 1 / (n × L_nn) where:
     * - n = number of tasks
     * - L_nn = tour length from nearest-neighbor heuristic
     * 
     * This scaling ensures pheromone values start in a reasonable range
     * that plays well with the algorithm's probability calculations.
     * 
     * @private
     */
    initializePheromones() {
        // Calculate nearest-neighbor baseline
        const { length: nnLength } = nearestNeighborTour(this.distMatrix, this.taskCount);

        // Initial pheromone level
        const tau0 = 1.0 / (this.taskCount * nnLength);

        // Initialize 2D pheromone matrix
        this.pheromones = [];
        for (let i = 0; i < this.taskCount; i++) {
            this.pheromones[i] = [];
            for (let j = 0; j < this.taskCount; j++) {
                this.pheromones[i][j] = tau0;
            }
        }
    }

    /**
     * Initialize ant population
     * Each ant has empty tour, zero length, and unvisited set
     */
    initializeAnts() {
        const ants = [];
        for (let i = 0; i < this.numAnts; i++) {
            ants.push({
                id: i,
                tour: [],
                length: 0,
                visited: new Set(),
                path: []  // For visualization: list of edges (connections)
            });
        }
        return ants;
    }

    /**
     * Reset all ants for new iteration
     */
    resetAnts() {
        this.ants.forEach(ant => {
            ant.tour = [];
            ant.length = 0;
            ant.visited = new Set();
            ant.path = [];
        });
    }

    /**
     * MAIN ALGORITHM: Run ACO for specified iterations
     * 
     * Executes the Ant System algorithm:
     * 1. Ants construct tours probabilistically (phase 1)
     * 2. Pheromones evaporate globally (phase 3)
     * 3. Best ant deposits reinforcement (elitist strategy)
     * 4. Visualization callback invoked each iteration
     * 
     * Uses async/await to yield to event loop (prevent UI freeze).
     * 
     * @async
     * @param {Function} [onIterationComplete=null] - Callback invoked each iteration
     * @param {number} onIterationComplete.iteration - Iteration number (0-indexed)
     * @param {number} onIterationComplete.bestLength - Best tour length found so far
     * @param {Array<Object>} onIterationComplete.ants - Current ant population state
     * @param {Array<Array<number>>} onIterationComplete.pheromones - Pheromone matrix at this iteration
     * 
     * @returns {Promise<Object>} Result object
     * @returns {Promise<Object.bestTour} {Array<number>} Best tour found (list of task indices)
     * @returns {Promise<Object.bestLength} {number} Length of best tour
     * @returns {Promise<Object.history} {Array<Object>} Iteration history (if tracking enabled)
     * 
     * @example
     * const result = await optimizer.optimize((iter, bestLen, ants, pheromones) => {
     *   console.log(`Iteration ${iter}: Best = ${bestLen.toFixed(2)}`);
     * });
     */
    async optimize(onIterationComplete = null) {
        for (let iter = 0; iter < this.numIterations; iter++) {
            // Reset ants for this iteration
            this.resetAnts();

            // Phase 1: Construction - each ant builds a tour
            this.constructTours();

            // Phase 2: Update best solution
            this.updateBestSolution();

            // Phase 3: Global pheromone update
            this.updatePheromones();

            // Phase 4: Callback for visualization
            if (onIterationComplete) {
                onIterationComplete(iter, this.bestLength, this.ants, this.pheromones);
            }

            // Yield to event loop every few iterations (prevent UI freeze)
            if (iter % 5 === 0) {
                await sleep(1);
            }

            // Track iteration history
            this.iterationHistory.push({
                iteration: iter,
                bestLength: this.bestLength,
                avgLength: this.getAverageLength(),
                // Store pheromones for visualization in step-through mode
                pheromones: deepCopy2D(this.pheromones),
                // Store sampled ants data for visualization
                ants: this.ants.map(ant => ({
                    id: ant.id,
                    tour: [...ant.tour],
                    path: [...ant.path],
                    length: ant.length
                }))
            });
        }

        return {
            bestTour: this.bestTour,
            bestLength: this.bestLength,
            history: this.iterationHistory
        };
    }

    /**
     * PHASE 1: Construct tours for all ants in population
     * 
     * Each ant builds a complete tour step-by-step:
     * 1. Start at random city
     * 2. At each step, probabilistically select next unvisited city
     * 3. Probability ∝ [pheromone^α] × [heuristic^β]
     * 4. Repeat until all cities visited
     * 
     * This stochastic tour construction creates diversity in solutions,
     * allowing exploration of different paths.
     * 
     * @private
     */
    constructTours() {
        // Start each ant at random city
        for (let ant of this.ants) {
            const startCity = Math.floor(Math.random() * this.taskCount);
            ant.tour.push(startCity);
            ant.visited.add(startCity);
        }

        // Build tours step-by-step
        while (this.ants[0].tour.length < this.taskCount) {
            for (let ant of this.ants) {
                const currentCity = ant.tour[ant.tour.length - 1];
                const nextCity = this.selectNextCity(ant, currentCity);

                if (nextCity !== -1) {
                    ant.tour.push(nextCity);
                    ant.visited.add(nextCity);
                    ant.path.push({ from: currentCity, to: nextCity });

                    // Update tour length
                    ant.length += this.distMatrix[currentCity][nextCity];
                }
            }
        }
    }

    /**
     * Probabilistically select next city for ant using roulette wheel selection
     * 
     * Probability of choosing city j from city i:
     *   P(j) = (τ_ij^α × η_ij^β) / Σ(τ_ik^α × η_ik^β)  for all unvisited k
     * 
     * Where:
     * - τ_ij = pheromone level on edge i→j
     * - η_ij = 1/distance_ij (heuristic: closer cities more desirable)
     * - α = pheromone importance weight
     * - β = heuristic importance weight
     * 
     * @private
     * @param {Object} ant - Ant state {tour, visited, ...}
     * @param {number} currentCity - Current city index
     * @returns {number} Next city index to visit (-1 if all visited)
     */
    selectNextCity(ant, currentCity) {
        const possibleCities = [];

        // Find all unvisited cities
        for (let j = 0; j < this.taskCount; j++) {
            if (!ant.visited.has(j)) {
                possibleCities.push(j);
            }
        }

        if (possibleCities.length === 0) return -1;

        // Calculate probabilities using pheromone and heuristic
        const probabilities = possibleCities.map(city => {
            const pheromone = this.pheromones[currentCity][city];
            const distance = this.distMatrix[currentCity][city];
            const heuristic = 1.0 / (distance + 0.0001); // +epsilon to avoid divide by zero

            // Probability formula: [τ^α] × [η^β]
            const numerator = Math.pow(pheromone, this.alpha) * Math.pow(heuristic, this.beta);
            return numerator;
        });

        // Normalize probabilities
        const sum = probabilities.reduce((a, b) => a + b, 0);
        const normalizedProbs = probabilities.map(p => p / sum);

        // Roulette wheel selection: pick city with probability proportional to attractiveness
        const r = Math.random();
        let cumulative = 0;
        for (let i = 0; i < possibleCities.length; i++) {
            cumulative += normalizedProbs[i];
            if (r <= cumulative) {
                return possibleCities[i];
            }
        }

        // Fallback (shouldn't reach here)
        return possibleCities[Math.floor(Math.random() * possibleCities.length)];
    }

    /**
     * PHASE 2: Update best solution found so far
     */
    updateBestSolution() {
        for (let ant of this.ants) {
            if (ant.tour.length === this.taskCount && ant.length < this.bestLength) {
                this.bestLength = ant.length;
                this.bestTour = [...ant.tour];
            }
        }
    }

    /**
     * PHASE 3: Global pheromone update
     * 1. Evaporate: τ ← (1 - ρ) × τ
     * 2. Best ant deposit: τ ← τ + Δτ (best ant deposits Q/L_best)
     * 3. Elitist strategy: Best ant deposits extra pheromone (2× multiplier)
     */
    updatePheromonesOptimized(ants, evaporationRate) {
    // First, evaporate all pheromones
    for (let i = 0; i < this.pheromones.length; i++) {
        for (let j = 0; j < this.pheromones[i].length; j++) {
            this.pheromones[i][j] *= (1 - evaporationRate);
        }
    }
    
    // Then add pheromones from ants (only best ants for performance)
    const antsToUse = ants.length > 50 ? ants.slice(0, 30) : ants; // Limit to 30 best ants
    
    for (const ant of antsToUse) {
        const contribution = 1 / ant.distance;
        for (let k = 0; k < ant.tour.length - 1; k++) {
            const i = ant.tour[k];
            const j = ant.tour[k + 1];
            this.pheromones[i][j] += contribution;
            this.pheromones[j][i] += contribution; // Symmetric
        }
    }
}
    /**
     * Calculate average tour length across all ants
     */
    getAverageLength() {
        const sum = this.ants.reduce((acc, ant) => acc + ant.length, 0);
        return sum / this.ants.length;
    }

    /**
     * Get current state for visualization
     * Returns ants positions and pheromone levels
     */
    getState() {
        return {
            ants: this.ants,
            pheromones: this.pheromones,
            bestTour: this.bestTour,
            bestLength: this.bestLength
        };
    }

    /**
     * Get statistical summary of optimization run
     */
    getSummary() {
        const firstLength = this.iterationHistory[0]?.bestLength || this.bestLength;
        const improvement = firstLength - this.bestLength;
        const improvementPercent = (improvement / firstLength) * 100;

        return {
            bestTour: this.bestTour,
            bestLength: this.bestLength,
            initialLength: firstLength,
            improvement,
            improvementPercent,
            iterations: this.numIterations,
            numAnts: this.numAnts,
            convergenceRate: this.calculateConvergenceRate()
        };
    }

    /**
     * Calculate convergence rate (how fast algorithm improved)
     * Simple metric: iterations to reach 90% of final improvement
     */
    calculateConvergenceRate() {
        let convergenceIter = this.numIterations;
        const targetImprovement = this.bestLength * 1.1; // 90% of best

        for (let i = 0; i < this.iterationHistory.length; i++) {
            if (this.iterationHistory[i].bestLength <= targetImprovement) {
                convergenceIter = i;
                break;
            }
        }

        return (convergenceIter / this.numIterations) * 100;
    }
    checkConvergence(bestDistance, iteration, maxIterations) {
        if (!this.convergenceHistory) {
            this.convergenceHistory = [];
        }
    
        this.convergenceHistory.push(bestDistance);
    
        // Keep only last 20 iterations
        if (this.convergenceHistory.length > 20) {
            this.convergenceHistory.shift();
        }
    
        // Check if no improvement in last 20 iterations
        if (this.convergenceHistory.length === 20) {
            const initial = this.convergenceHistory[0];
            const current = this.convergenceHistory[this.convergenceHistory.length - 1];
            const improvement = (initial - current) / initial;
        
            if (improvement < 0.01) { // Less than 1% improvement
                console.log(`Converged early at iteration ${iteration} (improvement < 1%)`);
                return true; // Converged
            }
        }
    
        return false;
    }
}
