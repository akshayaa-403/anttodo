/**
 * Utility functions
 */
export function sanitizeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, ch => map[ch]);
}

export function parseTasks(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return [];

    // Trim and split into lines
    const lines = rawInput.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    // Remove duplicate lines (case‑insensitive)
    const seen = new Set();
    const uniqueLines = [];
    for (const line of lines) {
        const lower = line.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            uniqueLines.push(line);
        }
    }

    // Build task objects with weights
    return uniqueLines.map((text, idx) => ({
        id: idx,
        text: text,
        weight: getTaskWeight(text),
    }));
}

/**
 * Calculate a weight (1‑10) based on importance keywords.
 * Base weight = 5; add boosts from keyword matches.
 * Final weight clamped to [1, 10].
 */
export function getTaskWeight(text) {
    const lower = text.toLowerCase();
    let boost = 0;
    for (const [keyword, value] of Object.entries(CONFIG.IMPORTANCE_KEYWORDS)) {
        if (lower.includes(keyword)) {
            boost += value;
        }
    }
    return Math.min(10, Math.max(1, 5 + boost));
}

export function validateList(tasks) {
    if (tasks.length < 2) {
        return { valid: false, message: 'Please enter at least 2 tasks.' };
    }
    // Additional non‑list heuristics (e.g. very long lines, URLs)
    const urlRegex = /https?:\/\/[^\s]+/;
    const codeIndicators = /<\/?[a-z][\s\S]*>/i; // crude HTML tag detection
    for (const task of tasks) {
        if (urlRegex.test(task.text)) {
            return { valid: false, message: 'Looks like a URL – please enter a to‑do list.' };
        }
        if (codeIndicators.test(task.text)) {
            return { valid: false, message: 'HTML tags not allowed – just write tasks.' };
        }
    }
    return { valid: true, message: '' };
}