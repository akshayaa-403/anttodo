/**
 * Ant Colony Optimizer for task ordering.
 * Minimizes sum of (weight_i * position_i).
 */
export default class ACO {
    constructor(tasks, config) {
        this.tasks = tasks;               // array of { id, weight }
        this.n = tasks.length;
        this.weights = tasks.map(t => t.weight);
        this.config = config;
        
        // Pheromone matrix: pheromones[i][j] = favorability of task j after task i
        this.pheromones = Array.from({ length: this.n }, () => Array(this.n).fill(1.0));
        
        this.bestTour = null;
        this.bestCost = Infinity;
    }

    /**
     * Run the optimization
     * @param {function} progressCallback({iteration, total, bestCost})
     * @returns { bestTour, bestCost, history }
     */
    async run(progressCallback = null) {
        const { numAnts, iterations, alpha, beta, rho, Q } = this.config;
        const history = [];

        for (let iter = 0; iter < iterations; iter++) {
            // Each ant builds a solution
            const antTours = [];
            for (let a = 0; a < numAnts; a++) {
                const tour = this.constructTour(alpha, beta);
                const cost = this.evaluateTour(tour);
                antTours.push({ tour, cost });
            }

            // Find iteration best and update global best
            let iterBest = antTours.reduce((best, curr) => curr.cost < best.cost ? curr : best);
            if (iterBest.cost < this.bestCost) {
                this.bestCost = iterBest.cost;
                this.bestTour = [...iterBest.tour];
            }

            // Global pheromone update
            this.evaporatePheromones(rho);
            this.depositPheromones(antTours, Q);

            // Record history
            history.push({ iteration: iter, bestCost: this.bestCost });

            if (progressCallback) {
                progressCallback({ iteration: iter + 1, total: iterations, bestCost: this.bestCost });
            }

            // Yield to event loop every few iterations
            if (iter % 5 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }

        return {
            bestTour: this.bestTour,
            bestCost: this.bestCost,
            history,
        };
    }

    constructTour(alpha, beta) {
        const visited = new Set();
        const tour = [];
        // Start with a random task
        const start = Math.floor(Math.random() * this.n);
        visited.add(start);
        tour.push(start);

        while (tour.length < this.n) {
            const last = tour[tour.length - 1];
            const probs = [];
            let sum = 0;

            // Compute probabilities for all unvisited tasks
            for (let j = 0; j < this.n; j++) {
                if (!visited.has(j)) {
                    const tau = this.pheromones[last][j];
                    const eta = this.weights[j];               // higher weight → more attractive
                    const prob = Math.pow(tau, alpha) * Math.pow(eta, beta);
                    probs.push({ task: j, prob });
                    sum += prob;
                }
            }

            // Roulette wheel selection
            const rand = Math.random() * sum;
            let cumulative = 0;
            for (const { task, prob } of probs) {
                cumulative += prob;
                if (rand <= cumulative) {
                    visited.add(task);
                    tour.push(task);
                    break;
                }
            }
        }

        return tour;
    }

    evaluateTour(tour) {
        // Cost = Σ (weight_i * position_i)   (position 1‑based)
        let cost = 0;
        for (let i = 0; i < tour.length; i++) {
            cost += this.weights[tour[i]] * (i + 1);
        }
        return cost;
    }

    evaporatePheromones(rho) {
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                this.pheromones[i][j] *= (1 - rho);
            }
        }
    }

    depositPheromones(antTours, Q) {
        for (const { tour, cost } of antTours) {
            const deposit = Q / (cost + 1e-6);
            for (let k = 0; k < tour.length - 1; k++) {
                const i = tour[k];
                const j = tour[k + 1];
                this.pheromones[i][j] += deposit;
                this.pheromones[j][i] += deposit; // symmetry
            }
        }
    }
}