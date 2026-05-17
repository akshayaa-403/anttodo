/**
 * Application constants – no user-configurable parameters.
 */
const CONFIG = {
    // ACO defaults (hard‑coded, no UI controls)
    ACO: {
        numAnts: 20,
        iterations: 60,         // fast enough, good convergence
        alpha: 1.0,            // pheromone importance
        beta: 2.0,             // heuristic importance (weight‑based)
        rho: 0.1,              // evaporation
        Q: 100,                // deposit constant
    },

    // Importance keywords and their weight boosts
    // A base weight of 5 is assumed for all tasks.
    IMPORTANCE_KEYWORDS: {
        urgent: 3,
        asap: 3,
        critical: 3,
        "high priority": 3,
        important: 2,
        due: 2,
        deadline: 2,
        tomorrow: 2,
        today: 2,
        "as soon as possible": 3,
    },
};

export default CONFIG;