/**
 * ============================================================================
 * CONFIG.JS - Centralized Configuration & Constants
 * ============================================================================
 * All magic numbers, default parameters, and constants defined in one place.
 * This enables easy tuning without searching entire codebase.
 */

const CONFIG = {
    /**
     * ACO Algorithm Parameters
     * Fine-tune the Ant Colony Optimization behavior
     */
    ACO: {
        // Default number of ants exploring solutions
        NUM_ANTS_DEFAULT: 25,
        NUM_ANTS_MIN: 5,
        NUM_ANTS_MAX: 100,

        // Default number of iterations
        NUM_ITERATIONS_DEFAULT: 80,
        NUM_ITERATIONS_MIN: 10,
        NUM_ITERATIONS_MAX: 500,

        // Pheromone importance (α)
        // Higher = favor pheromone trails more
        ALPHA: 1.0,

        // Heuristic importance (β)
        // Higher = favor nearby unvisited cities more
        BETA: 5.0,

        // Pheromone evaporation rate (ρ)
        // How much pheromone evaporates each iteration
        RHO: 0.15,

        // Pheromone deposit constant (Q)
        // Amount of pheromone deposited by ants
        Q: 200,

        // Pheromone bounds (prevent numerical issues)
        TAU_MIN: 0.0001,
        TAU_MAX: 10.0,

        // Elitist strategy bonus multiplier
        ELITIST_BONUS: 2.0,

        // Early termination: stop if no improvement for N iterations
        STAGNATION_LIMIT: 20,

        // Epsilon for distance calculations (prevent division by zero)
        DISTANCE_EPSILON: 0.0001,
    },

    /**
     * Canvas & Visualization Parameters
     */
    VISUALIZATION: {
        // Grid sizing
        GRID_SIZE: 40,

        // Task node styling
        NODE_RADIUS: 20,
        NODE_COLOR: '#2d6a4f',
        NODE_TEXT_COLOR: '#e8ebe9',

        // Pheromone trail visualization
        PHEROMONE_MIN_COLOR: 'rgba(45, 106, 79, 0.3)',
        PHEROMONE_MAX_COLOR: '#d97706',
        PHEROMONE_DISPLAY_THRESHOLD: 0.3, // Only show trails above this normalized value

        // Marching ants animation
        MARCHING_ANTS_SPEED: 3, // Pixels per frame
        MARCHING_ANTS_DASH_LENGTH: 10,
        MARCHING_ANTS_GAP_LENGTH: 8,

        // Ant character
        ANT_EMOJI: '🐜',
        ANT_SIZE: 16,

        // Arrow styling for edges
        EDGE_ARROW_LENGTH: 15,
        EDGE_ARROW_WIDTH: 8,

        // Animation colors
        BACKGROUND_COLOR: '#0a0f0d',
        GRID_COLOR: 'rgba(45, 106, 79, 0.15)',
        TRAIL_COLOR: 'rgba(217, 119, 6, 0.6)',

        // Animation timing (milliseconds)
        MARCHING_ANTS_ANIMATION_DURATION: 3000,
        PARTICLE_BURST_DURATION: 1500,
        PHEROMONE_BURST_COUNT: 20,
    },

    /**
     * UI & UX Parameters
     */
    UI: {
        // Text truncation in lists
        TASK_DISPLAY_MAX_LENGTH: 30,

        // Task input limits (for input validation in utils.js)
        MAX_INPUT_LENGTH: 50000, // Max characters total
        MAX_TASK_LENGTH: 1000,   // Max characters per task
        MAX_TASKS_PER_INPUT: 500,

        // Animation delays (milliseconds)
        LOADING_ANIMATION_BASE: 1500,
        LOADING_ANIMATION_RANDOM: 1000,

        // Slack in layout (pixels)
        CANVAS_PADDING: 50,

        // Convergence graph sizing
        GRAPH_WIDTH: 400,
        GRAPH_HEIGHT: 200,
        GRAPH_MARGIN: 30,

        // Button feedback
        BUTTON_DISABLED_OPACITY: 0.5,

        // Notification toast
        TOAST_DURATION_MS: 3000,
    },

    /**
     * Algorithm Convergence & Performance
     */
    PERFORMANCE: {
        TARGET_FPS: 60,
        FRAME_INTERVAL_MS: 1000 / 60,

        ENABLE_DIRTY_RECTS: true,
        DIRTY_RECT_PADDING: 5,

        CACHE_PHEROMONE_MINMAX: true,
        PHEROMONE_CACHE_UPDATE_INTERVAL: 5,

        ANT_POSITION_INTERPOLATION_STEPS: 4,
        MAX_ANTS_VISIBLE: 100,

        USE_OFFSCREEN_CANVAS: false,
        CANVAS_ANTIALIAS: true,

        THROTTLE_RENDER_ON_BACKGROUND: true,
        BACKGROUND_FPS_CAP: 15,

        BATCH_EDGE_DRAWING: true,
        MAX_EDGES_PER_FRAME: 200,
    },
    DEBUG: {
        SHOW_FPS_COUNTER: false,
        SHOW_RENDER_TIME: false,
        LOG_SLOW_OPERATIONS: true,
        SLOW_OPERATION_THRESHOLD_MS: 16,
    },
    
    /**
     * Accessibility & Responsive Design
     */
    ACCESSIBILITY: {
        // Minimum touch target size (WCAG AA)
        MIN_BUTTON_SIZE: 44,

        // Color contrast ratios (AA = 4.5:1, AAA = 7:1)
        MIN_CONTRAST_AA: 4.5,
        MIN_CONTRAST_AAA: 7,

        // Keyboard navigation
        ENABLE_KEYBOARD_SHORTCUTS: true,
        SHORTCUT_OPTIMIZE: 'Enter', // Ctrl/Cmd + Enter
        SHORTCUT_SAVE: 'S',         // Ctrl/Cmd + S
        SHORTCUT_LOAD: 'L',         // Ctrl/Cmd + L
    },

    /**
     * Color Palette (theme-aware)
     */
    COLORS: {
        DARK: {
            background: '#0a0f0d',
            surface: '#0f1410',
            surfaceHover: '#1a1f1d',
            text: '#e8ebe9',
            textSecondary: '#8b95a5',
            accent: '#2d6a4f',
            accentLight: '#52b788',
            warning: '#d97706',
            success: '#22c55e',
            error: '#ef4444',
        },
        LIGHT: {
            background: '#f8f9fa',
            surface: '#ffffff',
            surfaceHover: '#f3f4f6',
            text: '#1f2937',
            textSecondary: '#6b7280',
            accent: '#2d6a4f',
            accentLight: '#52b788',
            warning: '#d97706',
            success: '#22c55e',
            error: '#ef4444',
        },
    },

    /**
     * Storage & Persistence
     */
    STORAGE: {
        // localStorage keys
        SAVED_TASK_LISTS_KEY: 'savedTaskLists',
        APP_PREFERENCES_KEY: 'appPreferences',
        OPTIMIZATION_HISTORY_KEY: 'optimizationHistory',

        // localStorage limits
        MAX_STORED_LISTS: 100,
        MAX_STORED_HISTORY: 50,
    },

    /**
     * Export & Import Formats
     */
    EXPORT: {
        // iCal event duration (minutes)
        ICAL_DEFAULT_DURATION: 30,

        // Timestamp format
        TIMESTAMP_FORMAT: 'ISO', // 'ISO' or 'locale'
    },

    /**
     * Helper: Get current theme colors
     * @param {string} theme - 'dark' or 'light'
     * @returns {Object} Color palette for theme
     */
    getThemeColors(theme = 'dark') {
        return this.COLORS[theme.toUpperCase()] || this.COLORS.DARK;
    },

    /**
     * Helper: Get ACO defaults for new optimizer
     * @returns {Object} Default ACO parameters
     */
    getACODefaults() {
        return {
            alpha: this.ACO.ALPHA,
            beta: this.ACO.BETA,
            rho: this.ACO.RHO,
            Q: this.ACO.Q,
        };
    },

    /**
     * Helper: Get visualization defaults for new engine
     * @returns {Object} Default visualization parameters
     */
    getVisualizationDefaults() {
        return {
            gridSize: this.VISUALIZATION.GRID_SIZE,
            nodeRadius: this.VISUALIZATION.NODE_RADIUS,
            antEmoji: this.VISUALIZATION.ANT_EMOJI,
        };
    },
};

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
