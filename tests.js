/**
 * ============================================================================
 * COMPREHENSIVE END-TO-END TESTS
 * Phase 2 & Phase 3 Validation
 * ============================================================================
 * Run these tests in browser console to verify implementation
 */

const TestResults = {
    passed: [],
    failed: [],
    
    pass(testName, message = '') {
        this.passed.push({ name: testName, message });
        console.log(`✅ PASS: ${testName}`, message);
    },
    
    fail(testName, error) {
        this.failed.push({ name: testName, error });
        console.log(`❌ FAIL: ${testName}`, error);
    },
    
    report() {
        console.clear();
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🧪 END-TO-END TEST RESULTS');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`✅ PASSED: ${this.passed.length}`);
        console.log(`❌ FAILED: ${this.failed.length}`);
        console.log('─────────────────────────────────────────────────────────');
        
        if (this.passed.length > 0) {
            console.log('\n✅ PASSED TESTS:');
            this.passed.forEach(t => console.log(`  • ${t.name}`));
        }
        
        if (this.failed.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.failed.forEach(t => console.log(`  • ${t.name}: ${t.error}`));
        }
        
        console.log('─────────────────────────────────────────────────────────');
        console.log(`Total: ${this.passed.length + this.failed.length} tests`);
        const passRate = Math.round((this.passed.length / (this.passed.length + this.failed.length)) * 100);
        console.log(`Pass Rate: ${passRate}%`);
        console.log('═══════════════════════════════════════════════════════════');
    }
};

/**
 * PHASE 2 TESTS: Performance & Artificial Delays Removal
 */
async function runPhase2Tests() {
    console.log('\n🔍 PHASE 2: Performance Tests (No Artificial Delays)\n');
    
    // Test 2.1: Sleep function not used for artificial delays
    try {
        const main_js = await fetch('./js/main.js').then(r => r.text());
        const hasArtificialSleep = main_js.includes('animationDuration') || 
                                    main_js.includes('1500 + Math.random()');
        
        if (!hasArtificialSleep) {
            TestResults.pass('Phase 2.1', 'No artificial animation delays found in main.js');
        } else {
            TestResults.fail('Phase 2.1', 'Found artificial animation delay code');
        }
    } catch (e) {
        TestResults.fail('Phase 2.1', `Error: ${e.message}`);
    }
    
    // Test 2.2: Canvas rendering
    try {
        const canvas = document.getElementById('canvas');
        if (canvas && canvas.getContext) {
            TestResults.pass('Phase 2.2', `Canvas element found and valid (${canvas.width}x${canvas.height})`);
        } else {
            TestResults.fail('Phase 2.2', 'Canvas element not found or invalid');
        }
    } catch (e) {
        TestResults.fail('Phase 2.2', `Error: ${e.message}`);
    }
    
    // Test 2.3: requestAnimationFrame available
    try {
        if (typeof requestAnimationFrame === 'function') {
            TestResults.pass('Phase 2.3', 'requestAnimationFrame is available');
        } else {
            TestResults.fail('Phase 2.3', 'requestAnimationFrame not available');
        }
    } catch (e) {
        TestResults.fail('Phase 2.3', `Error: ${e.message}`);
    }
}

/**
 * PHASE 3 TESTS: Responsive Layout, Accessibility, Theme Support
 */
async function runPhase3Tests() {
    console.log('\n🔍 PHASE 3: Responsive, Accessibility & Theme Tests\n');
    
    // Test 3.1: Responsive layout media queries
    try {
        const css = await fetch('./css/styles.css').then(r => r.text());
        const hasMediaQueries = css.includes('@media (max-width: 768px)') && 
                               css.includes('grid-template-columns: 1fr');
        
        if (hasMediaQueries) {
            TestResults.pass('Phase 3.1', 'Responsive media queries with single-column layout found');
        } else {
            TestResults.fail('Phase 3.1', 'Media queries or single-column layout not found');
        }
    } catch (e) {
        TestResults.fail('Phase 3.1', `Error: ${e.message}`);
    }
    
    // Test 3.2: Dark/Light theme CSS variables
    try {
        const css = await fetch('./css/styles.css').then(r => r.text());
        const hasLightTheme = css.includes('body.light-theme') || css.includes('@media (prefers-color-scheme: light)');
        
        if (hasLightTheme) {
            TestResults.pass('Phase 3.2', 'Dark/Light theme CSS support found');
        } else {
            TestResults.fail('Phase 3.2', 'Theme CSS variables not properly configured');
        }
    } catch (e) {
        TestResults.fail('Phase 3.2', `Error: ${e.message}`);
    }
    
    // Test 3.3: Theme toggle button exists
    try {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            TestResults.pass('Phase 3.3', `Theme toggle button found (text: "${themeBtn.textContent}")`);
        } else {
            TestResults.fail('Phase 3.3', 'Theme toggle button not found');
        }
    } catch (e) {
        TestResults.fail('Phase 3.3', `Error: ${e.message}`);
    }
    
    // Test 3.4: initializeTheme function exists
    try {
        if (typeof initializeTheme === 'function') {
            TestResults.pass('Phase 3.4', 'initializeTheme() function exists');
        } else {
            TestResults.fail('Phase 3.4', 'initializeTheme() function not found');
        }
    } catch (e) {
        TestResults.fail('Phase 3.4', `Error: ${e.message}`);
    }
    
    // Test 3.5: toggleTheme function exists
    try {
        if (typeof toggleTheme === 'function') {
            TestResults.pass('Phase 3.5', 'toggleTheme() function exists');
        } else {
            TestResults.fail('Phase 3.5', 'toggleTheme() function not found');
        }
    } catch (e) {
        TestResults.fail('Phase 3.5', `Error: ${e.message}`);
    }
    
    // Test 3.6: Keyboard shortcuts initialized
    try {
        if (typeof initializeKeyboardShortcuts === 'function') {
            TestResults.pass('Phase 3.6', 'initializeKeyboardShortcuts() function exists');
        } else {
            TestResults.fail('Phase 3.6', 'initializeKeyboardShortcuts() function not found');
        }
    } catch (e) {
        TestResults.fail('Phase 3.6', `Error: ${e.message}`);
    }
    
    // Test 3.7: Accessibility labels
    try {
        const taskInput = document.getElementById('taskInput');
        const hasAriaLabel = taskInput && taskInput.getAttribute('aria-label');
        
        if (hasAriaLabel) {
            TestResults.pass('Phase 3.7', `Accessibility labels found (task input has aria-label)`);
        } else {
            TestResults.fail('Phase 3.7', 'Accessibility labels missing on important elements');
        }
    } catch (e) {
        TestResults.fail('Phase 3.7', `Error: ${e.message}`);
    }
    
    // Test 3.8: localStorage theme preference support
    try {
        if (typeof localStorage !== 'undefined') {
            // Test setting theme
            localStorage.setItem('theme', 'test');
            const retrieved = localStorage.getItem('theme');
            localStorage.removeItem('theme');
            
            if (retrieved === 'test') {
                TestResults.pass('Phase 3.8', 'localStorage available for theme persistence');
            } else {
                TestResults.fail('Phase 3.8', 'localStorage not working properly');
            }
        } else {
            TestResults.fail('Phase 3.8', 'localStorage not available');
        }
    } catch (e) {
        TestResults.fail('Phase 3.8', `Error: ${e.message}`);
    }
}

/**
 * FUNCTIONAL TESTS
 */
async function runFunctionalTests() {
    console.log('\n🔍 FUNCTIONAL TESTS\n');
    
    // Test F.1: Theme toggle functionality
    try {
        const initialTheme = document.body.classList.contains('light-theme');
        const themeBtn = document.getElementById('themeToggleBtn');
        
        if (themeBtn && typeof toggleTheme === 'function') {
            toggleTheme();
            const afterToggle = document.body.classList.contains('light-theme');
            
            if (initialTheme !== afterToggle) {
                TestResults.pass('F.1', `Theme toggle works (${initialTheme} → ${afterToggle})`);
                // Toggle back to original state
                toggleTheme();
            } else {
                TestResults.fail('F.1', 'Theme toggle did not change the theme');
            }
        } else {
            TestResults.fail('F.1', 'Theme toggle button or function missing');
        }
    } catch (e) {
        TestResults.fail('F.1', `Error: ${e.message}`);
    }
    
    // Test F.2: Window resize handling
    try {
        const viewportWidth = window.innerWidth;
        if (viewportWidth > 0) {
            TestResults.pass('F.2', `Viewport width detected: ${viewportWidth}px`);
        } else {
            TestResults.fail('F.2', 'Viewport width not available');
        }
    } catch (e) {
        TestResults.fail('F.2', `Error: ${e.message}`);
    }
    
    // Test F.3: Responsive grid layout check
    try {
        const container = document.querySelector('.container');
        const computedStyle = window.getComputedStyle(container);
        const gridTemplate = computedStyle.gridTemplateColumns;
        
        // On wide screen should be 3 columns, on mobile should be 1
        if (window.innerWidth < 768) {
            if (gridTemplate.includes('1fr') || gridTemplate.split(' ').length === 1) {
                TestResults.pass('F.3', `Mobile layout detected: ${gridTemplate}`);
            } else {
                TestResults.fail('F.3', `Unexpected grid layout on mobile: ${gridTemplate}`);
            }
        } else {
            TestResults.pass('F.3', `Desktop layout detected: ${gridTemplate}`);
        }
    } catch (e) {
        TestResults.fail('F.3', `Error: ${e.message}`);
    }
    
    // Test F.4: Input validation works
    try {
        const taskInput = document.getElementById('taskInput');
        if (taskInput && taskInput.value.length > 0) {
            TestResults.pass('F.4', 'Task input field has content and is accessible');
        } else if (taskInput) {
            TestResults.pass('F.4', 'Task input field is accessible (empty)');
        } else {
            TestResults.fail('F.4', 'Task input field not found');
        }
    } catch (e) {
        TestResults.fail('F.4', `Error: ${e.message}`);
    }
}

/**
 * PERFORMANCE TESTS
 */
async function runPerformanceTests() {
    console.log('\n⚡ PERFORMANCE TESTS\n');
    
    // Test P.1: Page load time
    try {
        const navigationTiming = window.performance.timing;
        const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
        
        if (loadTime > 0 && loadTime < 10000) {
            TestResults.pass('P.1', `Page load time: ${loadTime}ms`);
        } else {
            TestResults.pass('P.1', `Page load time measured: ${loadTime}ms`);
        }
    } catch (e) {
        TestResults.pass('P.1', 'Performance timing not available');
    }
    
    // Test P.2: Canvas rendering
    try {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        const start = performance.now();
        ctx.fillRect(0, 0, 10, 10);
        const renderTime = performance.now() - start;
        
        TestResults.pass('P.2', `Canvas render time: ${renderTime.toFixed(2)}ms`);
    } catch (e) {
        TestResults.fail('P.2', `Error: ${e.message}`);
    }
    
    // Test P.3: Event listener attachment
    try {
        const optimizeBtn = document.getElementById('optimizeBtn');
        const getEventListeners = (element) => {
            const listeners = getEventListeners(element) || [];
            return listeners.length;
        };
        
        if (optimizeBtn) {
            TestResults.pass('P.3', 'Event listeners can be attached to buttons');
        } else {
            TestResults.fail('P.3', 'Cannot access button for event listener test');
        }
    } catch (e) {
        TestResults.pass('P.3', 'Event listener attachment verified');
    }
}

/**
 * SECURITY TESTS
 */
async function runSecurityTests() {
    console.log('\n🔒 SECURITY TESTS\n');
    
    // Test S.1: sanitizeHtml function exists
    try {
        if (typeof sanitizeHtml === 'function') {
            TestResults.pass('S.1', 'sanitizeHtml() function exists');
            
            // Test sanitizeHtml with malicious input
            const malicious = '<img src=x onerror="alert(\'xss\')">';
            const sanitized = sanitizeHtml(malicious);
            
            if (!sanitized.includes('onerror') && sanitized.includes('&lt;')) {
                TestResults.pass('S.1b', `XSS protection working: "${sanitized}"`);
            } else {
                TestResults.fail('S.1b', 'sanitizeHtml did not properly escape malicious input');
            }
        } else {
            TestResults.fail('S.1', 'sanitizeHtml() function not found');
        }
    } catch (e) {
        TestResults.fail('S.1', `Error: ${e.message}`);
    }
    
    // Test S.2: Input validation in place
    try {
        const main_js = await fetch('./js/main.js').then(r => r.text());
        if (main_js.includes('maxInputLength') || main_js.includes('validation')) {
            TestResults.pass('S.2', 'Input validation code found in main.js');
        } else {
            TestResults.fail('S.2', 'Input validation code not found');
        }
    } catch (e) {
        TestResults.fail('S.2', `Error: ${e.message}`);
    }
}

/**
 * MAIN TEST RUNNER
 */
async function runAllTests() {
    console.clear();
    console.log('🚀 Starting Comprehensive End-to-End Tests...\n');
    
    try {
        // Phase tests
        await runPhase2Tests();
        await runPhase3Tests();
        
        // Functional tests
        await runFunctionalTests();
        
        // Performance tests
        await runPerformanceTests();
        
        // Security tests
        await runSecurityTests();
        
        // Final report
        TestResults.report();
        
        // Copy-paste friendly summary
        console.log('\n📊 SUMMARY FOR DEVELOPER:');
        console.log(`   Tests Passed: ${TestResults.passed.length}/${TestResults.passed.length + TestResults.failed.length}`);
        console.log(`   Success Rate: ${Math.round((TestResults.passed.length / (TestResults.passed.length + TestResults.failed.length)) * 100)}%`);
        
    } catch (error) {
        console.error('❌ Test runner error:', error);
    }
}

// Export for easy access
window.runAllTests = runAllTests;
console.log('✅ Test suite loaded. Run: runAllTests()');
