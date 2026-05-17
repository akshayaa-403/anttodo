import CONFIG from './config.js';
import { sanitizeHtml, parseTasks, validateList } from './utils.js';
import ACO from './aco.js';

document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('taskInput');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const validationMsg = document.getElementById('validationMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const resultsPanel = document.getElementById('resultsPanel');
    const originalList = document.getElementById('originalList');
    const optimizedList = document.getElementById('optimizedList');
    const improvementValue = document.getElementById('improvementValue');
    const themeToggle = document.getElementById('themeToggle');

    // Theme handling
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light', savedTheme === 'light');

    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    // Optimize button
    optimizeBtn.addEventListener('click', async () => {
        const raw = inputEl.value;
        // Step 1: Sanitize and parse
        const sanitized = sanitizeHtml(raw);
        const tasks = parseTasks(sanitized);

        // Step 2: Validate
        const validation = validateList(tasks);
        if (!validation.valid) {
            validationMsg.textContent = validation.message;
            validationMsg.classList.remove('hidden');
            resultsPanel.style.display = 'none';
            return;
        }
        validationMsg.classList.add('hidden');

        // Step 3: Run ACO
        optimizeBtn.disabled = true;
        loadingOverlay.classList.remove('hidden');
        resultsPanel.style.display = 'none';

        const aco = new ACO(tasks, CONFIG.ACO);
        const result = await aco.run(({ iteration, total, bestCost }) => {
            progressFill.style.width = `${(iteration / total) * 100}%`;
            progressText.textContent = `Iteration ${iteration}/${total} – best cost: ${bestCost?.toFixed(1) || '…'}`;
        });

        // Step 4: Display results
        displayResults(tasks, result);

        loadingOverlay.classList.add('hidden');
        optimizeBtn.disabled = false;
    });

    function displayResults(tasks, acoResult) {
        // Original order cost
        const originalOrder = tasks.map(t => t.id);
        const originalCost = calculateCost(tasks, originalOrder);
        const optimizedCost = acoResult.bestCost;

        // Improvement percentage (original cost based)
        const improvement = originalCost > 0
            ? ((originalCost - optimizedCost) / originalCost * 100).toFixed(1)
            : 0;

        // Render lists
        originalList.innerHTML = tasks
            .map(task => `<li>${task.text}</li>`)
            .join('');

        optimizedList.innerHTML = acoResult.bestTour
            .map(id => `<li>${tasks[id].text}</li>`)
            .join('');

        improvementValue.textContent = `${improvement}%`;

        resultsPanel.style.display = 'block';
    }

    function calculateCost(tasks, order) {
        let cost = 0;
        order.forEach((taskId, idx) => {
            cost += tasks[taskId].weight * (idx + 1);
        });
        return cost;
    }
});