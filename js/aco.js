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
 * 
 * Papers Reference:
 * - Dorigo & Gambardella (1997): "Ant Colony System"
 * - Dorigo (1992): "Optimization, Learning, and Natural Algorithms"
 */

class AntColonyOptimizer {
    /**
     * Initialize ACO parameters
     * @param {number} taskCount - Number of tasks (cities)
     * @param {Array} distMatrix - 2D distance matrix
     * @param {Object} params - Configuration parameters
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
     * Initialize pheromone trails
     * Sets initial pheromone to τ₀ = 1 / (n × L_nn)
     * where L_nn is nearest-neighbor tour length
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
     * Callback is invoked each iteration for progress/visualization updates
     * @param {Function} onIterationComplete - Callback(iterationNumber, bestLength, ants, pheromones)
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
     * PHASE 1: Ant Tour Construction
     * Each ant builds a complete tour by probabilistically choosing next city
     * Based on pheromone levels and heuristic desirability
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
     * Probabilistically select next city for ant
     * Probability ∝ [pheromone^α] × [heuristic^β]
     * @param {Object} ant - Ant state
     * @param {number} currentCity - Current city index
     * @returns {number} Next city index (-1 if all visited)
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
    updatePheromones() {
        // Step 1: Evaporate all pheromones
        for (let i = 0; i < this.taskCount; i++) {
            for (let j = 0; j < this.taskCount; j++) {
                this.pheromones[i][j] *= (1.0 - this.rho);
            }
        }

        // Step 2: Deposit pheromone for all ants
        for (let ant of this.ants) {
            if (ant.tour.length === this.taskCount) {
                const deposit = this.Q / ant.length;
                for (let i = 0; i < ant.tour.length - 1; i++) {
                    const from = ant.tour[i];
                    const to = ant.tour[i + 1];
                    this.pheromones[from][to] += deposit;
                    this.pheromones[to][from] += deposit; // Undirected graph
                }
            }
        }

        // Step 3: Elitist strategy - best ant deposits extra pheromone
        if (this.bestTour && this.bestTour.length > 0) {
            const elitistDeposit = (this.Q / this.bestLength) * 2; // 2× bonus for best
            for (let i = 0; i < this.bestTour.length - 1; i++) {
                const from = this.bestTour[i];
                const to = this.bestTour[i + 1];
                this.pheromones[from][to] += elitistDeposit;
                this.pheromones[to][from] += elitistDeposit;
            }
        }

        // Clamp pheromones to reasonable bounds (prevent numerical issues)
        const minPheromone = 1e-4;
        const maxPheromone = 1e2;
        for (let i = 0; i < this.taskCount; i++) {
            for (let j = 0; j < this.taskCount; j++) {
                this.pheromones[i][j] = clamp(
                    this.pheromones[i][j],
                    minPheromone,
                    maxPheromone
                );
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
}
