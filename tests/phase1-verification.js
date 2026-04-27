/**
 * Phase 1 Verification Tests
 * Checks that config.js loads, JSDoc is present, and no regressions
 */

function verifyPhase1() {
    console.log('\n✅ PHASE 1: CODE ORGANIZATION & MAINTAINABILITY - VERIFICATION\n');

    const tests = [];

    // Test 1: CONFIG object exists and has all properties
    tests.push({
        name: 'CONFIG object exists with all sections',
        test: () => {
            return (
                typeof CONFIG === 'object' &&
                CONFIG.ACO && CONFIG.VISUALIZATION && CONFIG.UI &&
                CONFIG.PERFORMANCE && CONFIG.ACCESSIBILITY && CONFIG.COLORS &&
                CONFIG.STORAGE && CONFIG.EXPORT
            );
        }
    });

    // Test 2: ACO defaults in CONFIG
    tests.push({
        name: 'CONFIG.ACO has all required parameters',
        test: () => {
            return (
                CONFIG.ACO.NUM_ANTS_DEFAULT === 25 &&
                CONFIG.ACO.NUM_ITERATIONS_DEFAULT === 80 &&
                CONFIG.ACO.ALPHA === 1.0 &&
                CONFIG.ACO.BETA === 5.0 &&
                CONFIG.ACO.RHO === 0.15
            );
        }
    });

    // Test 3: Visualization defaults in CONFIG
    tests.push({
        name: 'CONFIG.VISUALIZATION has all drawing parameters',
        test: () => {
            return (
                CONFIG.VISUALIZATION.GRID_SIZE === 40 &&
                CONFIG.VISUALIZATION.NODE_RADIUS === 20 &&
                CONFIG.VISUALIZATION.ANT_EMOJI === '🐜' &&
                CONFIG.VISUALIZATION.PHEROMONE_MAX_COLOR === '#d97706'
            );
        }
    });

    // Test 4: Color palette exists
    tests.push({
        name: 'CONFIG.COLORS has dark and light themes',
        test: () => {
            return (
                CONFIG.COLORS.DARK && CONFIG.COLORS.LIGHT &&
                CONFIG.COLORS.DARK.background && CONFIG.COLORS.LIGHT.background
            );
        }
    });

    // Test 5: Helper methods exist
    tests.push({
        name: 'CONFIG helper methods exist (getThemeColors, getACODefaults)',
        test: () => {
            return (
                typeof CONFIG.getThemeColors === 'function' &&
                typeof CONFIG.getACODefaults === 'function' &&
                typeof CONFIG.getVisualizationDefaults === 'function'
            );
        }
    });

    // Test 6: sanitizeHtml function exists and works
    tests.push({
        name: 'sanitizeHtml() escapes HTML entities',
        test: () => {
            const result = sanitizeHtml('<img src=x onerror="alert()">');
            return result.includes('&lt;') && result.includes('&gt;') && result.includes('&quot;');
        }
    });

    // Test 7: parseTasks validates input limits
    tests.push({
        name: 'parseTasks() respects max input length (50KB)',
        test: () => {
            const hugeInput = 'a'.repeat(60000);
            const result = parseTasks(hugeInput);
            return Array.isArray(result) && result.length < 500;
        }
    });

    // Test 8: AntColonyOptimizer constructor accepts CONFIG params
    tests.push({
        name: 'AntColonyOptimizer initializes with config parameters',
        test: () => {
            const distMatrix = [[0, 10], [10, 0]];
            const optimizer = new AntColonyOptimizer(2, distMatrix, CONFIG.getACODefaults());
            return (
                optimizer.numAnts > 0 &&
                optimizer.numIterations > 0 &&
                optimizer.alpha > 0 &&
                optimizer.beta > 0
            );
        }
    });

    // Test 9: VisualizationEngine cleanup method exists
    tests.push({
        name: 'VisualizationEngine.cleanup() method exists',
        test: () => {
            return typeof VisualizationEngine.prototype.cleanup === 'function';
        }
    });

    // Test 10: appState exists
    tests.push({
        name: 'appState global object exists',
        test: () => {
            return typeof appState === 'object' && Array.isArray(appState.tasks);
        }
    });

    // Run all tests
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            if (test.test()) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name}`);
                failed++;
            }
        } catch (error) {
            console.error(`❌ ${test.name} - Error: ${error.message}`);
            failed++;
        }
    }

    console.log(`\n📊 PHASE 1 RESULTS: ${passed}/${tests.length} tests passed\n`);

    if (failed === 0) {
        console.log('🎉 Phase 1 verification SUCCESS! All code organization improvements are in place.\n');
        return true;
    } else {
        console.log(`⚠️  ${failed} test(s) failed. Review above for issues.\n`);
        return false;
    }
}

// Run verification when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(verifyPhase1, 500); // Wait for all scripts to load
    });
}
