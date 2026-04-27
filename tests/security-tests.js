/**
 * Security Tests for Phase 0: XSS Prevention
 * Tests sanitizeHtml function and input validation
 */

// Mock test environment
const assert = (condition, message) => {
    if (!condition) {
        console.error('❌ TEST FAILED:', message);
        return false;
    }
    console.log('✅ PASSED:', message);
    return true;
};

// Test 1: XSS Prevention - Script Tags
function testXSSScriptTags() {
    const maliciousInput = '<img src=x onerror="alert(\'XSS\')">';
    const result = sanitizeHtml(maliciousInput);
    const expected = '&lt;img src=x onerror=&quot;alert(&#39;XSS&#39;)&quot;&gt;';
    return assert(result === expected, `XSS script tag sanitized: "${maliciousInput}" → "${result}"`);
}

// Test 2: XSS Prevention - Event Handler
function testXSSEventHandler() {
    const maliciousInput = '<div onclick="alert(\'hacked\')">Click me</div>';
    const result = sanitizeHtml(maliciousInput);
    const shouldNotContain = 'onclick=';
    return assert(!result.includes('onclick='), `XSS event handler sanitized: output doesn't contain "onclick="`);
}

// Test 3: Safe HTML Escaping - Ampersands
function testAmpersandEscaping() {
    const input = 'Tom & Jerry';
    const result = sanitizeHtml(input);
    return assert(result === 'Tom &amp; Jerry', `Ampersands escaped: "${input}" → "${result}"`);
}

// Test 4: Safe HTML Escaping - Quotes
function testQuoteEscaping() {
    const input = 'Say "hello" & \'goodbye\'';
    const result = sanitizeHtml(input);
    return assert(
        result.includes('&quot;') && result.includes('&#39;'),
        `Quotes escaped: "${input}" → "${result}"`
    );
}

// Test 5: Input Validation - Max Length Enforcement
function testInputMaxLength() {
    const hugeInput = 'a'.repeat(60000); // Over 50000 limit
    const result = parseTasks(hugeInput);
    // Should not crash; should truncate
    return assert(result !== null && Array.isArray(result), `Large input handled gracefully without crash`);
}

// Test 6: Input Validation - Max Task Length
function testTaskMaxLength() {
    const hugeTask = '1. ' + 'x'.repeat(2000); // Over 1000 limit
    const result = parseTasks(hugeTask);
    return assert(
        result.length > 0 && result[0].originalText.length <= 1000,
        `Individual task truncated to max 1000 chars`
    );
}

// Test 7: Input Validation - Max Tasks Per Input
function testMaxTasksLimit() {
    const manyTasks = Array(600)
        .fill(0)
        .map((_, i) => `Task ${i + 1}`)
        .join('\\n');
    const result = parseTasks(manyTasks);
    return assert(result.length <= 500, `Task limit enforced: ${result.length} tasks (max 500)`);
}

// Test 8: Duplicate Detection Still Works
function testDuplicateDetection() {
    const input = 'Task A\\nTask B\\nTask A\\nTask B';
    const result = parseTasks(input);
    return assert(result.length === 2, `Duplicates removed: ${input} → ${result.length} unique tasks`);
}

// Test 9: Canvas Cleanup Method Exists
function testCanvasCleanupMethod() {
    return assert(
        typeof VisualizationEngine.prototype.cleanup === 'function',
        `VisualizationEngine.cleanup() method exists`
    );
}

// Test 10: Normal Safe Text Passes Through
function testSafeTextPassthrough() {
    const safeInput = 'Buy groceries (1h - high priority)';
    const result = sanitizeHtml(safeInput);
    // Should only escape if needed
    return assert(
        result.includes('Buy groceries') && result.includes('high priority'),
        `Safe text passes through: "${safeInput}" → "${result}"`
    );
}

/**
 * Run All Security Tests
 */
function runSecurityTests() {
    console.log('\\n🔒 RUNNING PHASE 0 SECURITY TESTS\\n');

    const tests = [
        testXSSScriptTags,
        testXSSEventHandler,
        testAmpersandEscaping,
        testQuoteEscaping,
        testInputMaxLength,
        testTaskMaxLength,
        testMaxTasksLimit,
        testDuplicateDetection,
        testCanvasCleanupMethod,
        testSafeTextPassthrough
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            if (test()) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ TEST ERROR: ${test.name}`, error);
            failed++;
        }
    }

    console.log(`\\n📊 RESULTS: ${passed} passed, ${failed} failed out of ${tests.length} tests\\n`);
    return failed === 0;
}

// Export for use in browser console
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runSecurityTests };
}
