/**
 * ============================================================================
 * MAIN.JS - Application Controller & Orchestration
 * ============================================================================
 * Handles:
 * - UI event listeners (buttons, inputs, sliders)
 * - Data flow between ACO algorithm and visualization
 * - Loading overlay management
 * - Results display and formatting
 * - State management
 */

// Global state
let appState = {
    tasks: [],
    positions: {},
    taskCount: 0,
    optimizer: null,
    visualization: null,
    distMatrix: null,
    optimizationResult: null,
    isOptimizing: false
};

/**
 * Initialize application on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐜 Ant To-Do List starting...');

    // Initialize UI elements
    initializeEventListeners();
    initializeParameterSliders();

    // Load default example
    loadTasks();

    // Pre-create visualization (empty state)
    const canvas = document.getElementById('canvas');
    appState.visualization = new VisualizationEngine(canvas, {}, 0, []);

    // Initialize progress text to empty (will update during optimization)
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = '';
    }

    console.log('✅ App initialized');
});

/**
 * Setup all event listeners
 */
function initializeEventListeners() {
    const optimizeBtn = document.getElementById('optimizeBtn');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const loadExampleBtn = document.getElementById('loadExampleBtn');
    const resetBtn = document.getElementById('resetBtn');
    const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
    const saveListBtn = document.getElementById('saveListBtn');
    const loadListDropdown = document.getElementById('loadListDropdown');
    const deleteSavedBtn = document.getElementById('deleteSavedBtn');

    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', handleOptimize);
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', handleAddTask);
    }

    if (loadExampleBtn) {
        loadExampleBtn.addEventListener('click', handleLoadExample);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
    }

    if (toggleAdvancedBtn) {
        toggleAdvancedBtn.addEventListener('click', handleToggleAdvanced);
    }

    // Save/Load list handlers
    if (saveListBtn) {
        saveListBtn.addEventListener('click', handleSaveList);
    }

    if (loadListDropdown) {
        loadListDropdown.addEventListener('change', handleLoadList);
    }

    if (deleteSavedBtn) {
        deleteSavedBtn.addEventListener('click', handleDeleteSavedList);
    }

    // Textarea input
    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.addEventListener('change', loadTasks);
        // Add live preview on input
        taskInput.addEventListener('input', loadTasks);
    }

    // Initialize saved lists dropdown
    updateSavedListsDropdown();
}

/**
 * Setup parameter sliders
 */
function initializeParameterSliders() {
    const sliders = ['numAnts', 'numIterations', 'alpha', 'beta', 'rho', 'q'];

    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(sliderId + 'Value');

        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                valueDisplay.textContent = parseFloat(e.target.value).toFixed(
                    sliderId === 'rho' || sliderId === 'beta' ? 2 : 0
                );
            });
        }
    });
}

/**
 * Show validation error/warning message
 */
function showValidationMessage(message, type = 'error') {
    const messageEl = document.getElementById('validationMessage');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `validation-message ${type}`;
    messageEl.setAttribute('role', 'alert');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 5000);
}

/**
 * Clear validation message
 */
function clearValidationMessage() {
    const messageEl = document.getElementById('validationMessage');
    if (messageEl) {
        messageEl.classList.add('hidden');
    }
}

/**
 * Handle optimize button click
 */
async function handleOptimize() {
    if (appState.isOptimizing) {
        console.log('❌ Already optimizing');
        return;
    }

    // Reload tasks from textarea
    loadTasks();

    // Validate
    const validation = validateTaskCount(appState.tasks);
    if (!validation.valid) {
        showValidationMessage(validation.warning);
        return;
    }

    clearValidationMessage();

    appState.isOptimizing = true;

    // Update button state
    const optimizeBtn = document.getElementById('optimizeBtn');
    const originalText = optimizeBtn.innerHTML;
    optimizeBtn.innerHTML = '⏳ Ants are working...';
    optimizeBtn.disabled = true;

    try {
        // Show loading overlay
        showLoadingOverlay();

        // Force animation duration (1.5-2.5 seconds minimum)
        const animationDuration = 1500 + Math.random() * 1000;
        const startTime = Date.now();

        // Run ACO optimization with callback for real-time visualization
        const result = await runOptimization();

        // Wait remaining time for animation
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < animationDuration) {
            await sleep(animationDuration - elapsedTime);
        }

        // Hide loading overlay
        hideLoadingOverlay();

        // Display results
        appState.optimizationResult = result;
        displayResults(result);

        // Show final path animation
        if (appState.visualization) {
            appState.visualization.showFinalPathAnimation();
        }

        console.log('✅ Optimization complete', result);
    } catch (error) {
        console.error('❌ Optimization error:', error);
        alert('Optimization failed: ' + error.message);
        hideLoadingOverlay();
    } finally {
        appState.isOptimizing = false;
        optimizeBtn.innerHTML = originalText;
        optimizeBtn.disabled = false;
    }
}

/**
 * Run ACO optimization with visualization updates
 */
async function runOptimization() {
    const taskCount = appState.tasks.length;

    // Generate positions if not already done
    if (!appState.positions || Object.keys(appState.positions).length === 0) {
        const canvas = document.getElementById('canvas');
        appState.positions = generateTaskPositions(taskCount, canvas.width, canvas.height);
    }

    // Build distance matrix
    appState.distMatrix = buildDistanceMatrix(appState.positions, taskCount);

    // Get parameters from UI
    const params = getACOParameters();

    // Create optimizer
    const optimizer = new AntColonyOptimizer(taskCount, appState.distMatrix, params);
    appState.optimizer = optimizer;

    // Initialize visualization (pass tasks for node labels)
    if (!appState.visualization || appState.visualization.taskCount !== taskCount) {
        const canvas = document.getElementById('canvas');
        appState.visualization = new VisualizationEngine(canvas, appState.positions, taskCount, appState.tasks);
    }

    // Run ACO with visualization callback
    let lastIterationUpdate = 0;
    const result = await optimizer.optimize((iteration, bestLength, ants, pheromones) => {
        const totalIterations = params.numIterations;
        const progressPercent = (iteration / totalIterations) * 100;

        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) {
            progressFill.style.width = progressPercent + '%';
        }
        if (progressText) {
            progressText.textContent = `Iteration ${iteration + 1}/${totalIterations}`;
        }

        // Update visualization every 2 iterations (performance)
        if (iteration - lastIterationUpdate >= 2) {
            appState.visualization.updateState({
                ants,
                pheromones,
                bestTour: optimizer.bestTour,
                bestLength: bestLength
            });
            lastIterationUpdate = iteration;
        }
    });

    // Final visualization update
    if (appState.visualization) {
        appState.visualization.updateState({
            ants: optimizer.ants,
            pheromones: optimizer.pheromones,
            bestTour: optimizer.bestTour,
            bestLength: optimizer.bestLength
        });
    }

    return optimizer.getSummary();
}

/**
 * Get ACO parameters from UI sliders
 */
function getACOParameters() {
    return {
        numAnts: parseInt(document.getElementById('numAnts').value),
        numIterations: parseInt(document.getElementById('numIterations').value),
        alpha: parseFloat(document.getElementById('alpha').value),
        beta: parseFloat(document.getElementById('beta').value),
        rho: parseFloat(document.getElementById('rho').value),
        Q: parseInt(document.getElementById('q').value)
    };
}

/**
 * Display optimization results
 */
function displayResults(result) {
    const currentOrderList = document.getElementById('currentOrderList');
    const optimizedOrderList = document.getElementById('optimizedOrderList');
    const statsContainer = document.getElementById('statsContainer');
    const explanationText = document.getElementById('explanation');

    // Display current order
    const currentOrderHtml = appState.tasks
        .map((task, idx) => `<li>${(idx + 1)}. ${truncateText(task.displayText || task.text, 30)}</li>`)
        .join('');
    currentOrderList.innerHTML = `<ol>${currentOrderHtml}</ol>`;

    // Display optimized order
    if (result.bestTour && result.bestTour.length > 0) {
        const optimizedOrderHtml = result.bestTour
            .map((taskIdx, displayIdx) => {
                const task = appState.tasks[taskIdx];
                return `<li>${(displayIdx + 1)}. ${truncateText(task.displayText || task.text, 30)}</li>`;
            })
            .join('');
        optimizedOrderList.innerHTML = `<ol>${optimizedOrderHtml}</ol>`;
    }

    // Display statistics as metric cards
    const timeSaved = (result.improvement / 10).toFixed(1); // Rough estimate in minutes
    const priorityBoost = Math.round(result.improvementPercent * 1.3);
    
    const statsHtml = `
        <div class="metric-card">
            <div class="metric-icon">⏱️</div>
            <div class="metric-value">${timeSaved}min</div>
            <div class="metric-label">Time Optimized</div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">🔥</div>
            <div class="metric-value">+${priorityBoost}%</div>
            <div class="metric-label">Urgency Gain</div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">🐜</div>
            <div class="metric-value">${result.iterations}</div>
            <div class="metric-label">Iterations</div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">🏆</div>
            <div class="metric-value">${result.improvementPercent.toFixed(1)}%</div>
            <div class="metric-label">Route Improvement</div>
        </div>
    `;
    statsContainer.innerHTML = statsHtml;

    // Display explanation
    const improvementMsg = result.improvementPercent > 0
        ? `The colony discovered a path that is ${result.improvementPercent.toFixed(1)}% shorter than your original order!`
        : 'Your original order was already quite good!';

    const explanationMsg = `${improvementMsg} The ACO algorithm used ${result.numAnts} ants exploring ${result.iterations} iterations to find this optimization. Each ant follows pheromone trails (strongest paths) and heuristic guidance (distance proximity) to build complete tours. Over iterations, successful ants boost pheromone levels on edges they used, causing the colony to converge on the best discovered solution. This simulates real ant colony behavior for problem-solving!`;

    explanationText.innerHTML = explanationMsg;

    // Update canvas message
    if (appState.visualization) {
        appState.visualization.displayMessage(`✅ Optimization complete! Distance improved by ${result.improvementPercent.toFixed(1)}%`);
    }
}

/**
 * Load tasks from textarea
 */
function loadTasks() {
    const taskInput = document.getElementById('taskInput');
    const inputText = taskInput ? taskInput.value : '';

    appState.tasks = parseTasks(inputText);
    appState.taskCount = appState.tasks.length;

    // Update current order display
    updateCurrentOrderDisplay();

    // Regenerate positions if task count changed
    const oldTaskCount = Object.keys(appState.positions).length;
    if (appState.taskCount !== oldTaskCount) {
        const canvas = document.getElementById('canvas');
        appState.positions = generateTaskPositions(appState.taskCount, canvas.width, canvas.height);

        // Reset visualization
        if (appState.visualization) {
            appState.visualization.reset();
        }
    }

    console.log(`📋 Loaded ${appState.taskCount} tasks`);
}

/**
 * Update current order display
 */
function updateCurrentOrderDisplay() {
    const currentOrderList = document.getElementById('currentOrderList');

    if (appState.tasks.length === 0) {
        currentOrderList.innerHTML = '<p class="empty-state">No tasks yet. Enter some above.</p>';
        return;
    }

    const html = `<ol>${appState.tasks
        .map((task, idx) => `<li>${(idx + 1)}. ${truncateText(task.displayText || task.text, 30)}</li>`)
        .join('')}</ol>`;

    currentOrderList.innerHTML = html;
    renderTaskPreview();
}

/**
 * Render task preview with enhanced cards
 */
function renderTaskPreview() {
    const taskListPreview = document.getElementById('taskListPreview');

    if (appState.tasks.length === 0) {
        taskListPreview.innerHTML = '<p class="empty-state">Enter tasks above to see preview</p>';
        return;
    }

    const cardsHtml = appState.tasks.map(task => {
        const priorityClass = task.priority ? task.priority.toLowerCase() : 'medium';
        const completedClass = task.completed ? 'completed' : '';
        const displayText = task.displayText || task.text;

        return `
            <div class="task-card ${priorityClass} ${completedClass}" data-task-id="${task.id}">
                <input type="checkbox" class="task-card-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-card-content">
                    <div class="task-card-header">
                        <span class="task-emoji">${task.emoji || '📝'}</span>
                        <span class="task-text">${truncateText(displayText, 35)}</span>
                    </div>
                    <div class="task-badges">
                        ${task.priority ? `<span class="task-badge priority">${task.priority}</span>` : ''}
                        ${task.duration ? `<span class="task-badge duration">⏱️ ${task.duration}min</span>` : ''}
                    </div>
                </div>
                <button class="task-delete-btn" data-task-id="${task.id}" title="Delete this task">✕</button>
            </div>
        `;
    }).join('');

    taskListPreview.innerHTML = cardsHtml;

    // Add event listeners for delete buttons
    taskListPreview.querySelectorAll('.task-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = parseInt(btn.getAttribute('data-task-id'));
            handleDeleteTask(taskId);
        });
    });
}

/**
 * Handle delete task from list
 */
function handleDeleteTask(taskId) {
    const taskInput = document.getElementById('taskInput');
    if (!taskInput || taskId < 0 || taskId >= appState.tasks.length) return;

    const taskToDelete = appState.tasks[taskId];

    // Find and remove this task from textarea
    const lines = taskInput.value.split('\n');
    const newLines = lines.filter(line => {
        const parsed = parseTasks(line.trim());
        if (parsed.length === 0) return true; // Keep empty lines filtered by parseTasks
        const parsedText = parsed[0].displayText || parsed[0].text;
        const targetText = taskToDelete.displayText || taskToDelete.text;
        return parsedText !== targetText;
    });

    taskInput.value = newLines.join('\n').trim();
    loadTasks();
}

/**
 * Handle add task button
 */
function handleAddTask() {
    const taskInput = document.getElementById('taskInput');
    if (!taskInput) return;

    const newTask = prompt('Enter new task:');
    if (newTask && newTask.trim()) {
        taskInput.value += '\n' + newTask.trim();
        loadTasks();
    }
}

/**
 * Handle load example button
 */
function handleLoadExample() {
    const exampleTasks = [
        '1. Reply to emails',
        '2. Fix bug in authentication',
        '3. Design new dashboard',
        '4. Meeting notes update',
        '5. Update documentation',
        '6. Code review for team',
        '7. Lunch break',
        '8. Deploy staging build',
        '9. Team standup',
        '10. Research new tools'
    ];

    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.value = exampleTasks.join('\n');
        loadTasks();
    }
}

/**
 * Handle save list button
 */
function handleSaveList() {
    const saveListName = document.getElementById('saveListName');
    const name = saveListName ? saveListName.value.trim() : '';

    if (!name) {
        showValidationMessage('Please enter a name for the list', 'warning');
        return;
    }

    if (appState.tasks.length === 0) {
        showValidationMessage('No tasks to save', 'warning');
        return;
    }

    const success = saveTaskList(name, appState.tasks);
    if (success) {
        showValidationMessage(`✅ Saved "${name}" with ${appState.tasks.length} tasks`, 'success');
        if (saveListName) saveListName.value = '';
        updateSavedListsDropdown();
    } else {
        showValidationMessage('Failed to save list', 'error');
    }
}

/**
 * Handle load list dropdown
 */
function handleLoadList(e) {
    const listName = e.target.value;
    if (!listName) {
        document.getElementById('deleteSavedBtn').style.display = 'none';
        return;
    }

    const tasks = loadTaskList(listName);
    if (tasks) {
        const taskInput = document.getElementById('taskInput');
        if (taskInput) {
            taskInput.value = tasks.join('\n');
            loadTasks();
            showValidationMessage(`✅ Loaded "${listName}"`, 'success');
        }
    }

    document.getElementById('deleteSavedBtn').style.display = 'inline-block';
}

/**
 * Handle delete saved list
 */
function handleDeleteSavedList() {
    const loadListDropdown = document.getElementById('loadListDropdown');
    const listName = loadListDropdown ? loadListDropdown.value : '';

    if (!listName) {
        showValidationMessage('No list selected', 'warning');
        return;
    }

    if (confirm(`Delete "${listName}"?`)) {
        const success = deleteTaskList(listName);
        if (success) {
            showValidationMessage(`✅ Deleted "${listName}"`, 'success');
            loadListDropdown.value = '';
            document.getElementById('deleteSavedBtn').style.display = 'none';
            updateSavedListsDropdown();
        }
    }
}

/**
 * Update saved lists dropdown with current saved lists
 */
function updateSavedListsDropdown() {
    const loadListDropdown = document.getElementById('loadListDropdown');
    if (!loadListDropdown) return;

    const savedLists = getSavedTaskLists();
    const currentValue = loadListDropdown.value;

    // Clear options except the placeholder
    loadListDropdown.innerHTML = '<option value="">📂 My Saved Lists</option>';

    // Add saved lists sorted by name
    const sortedLists = Object.keys(savedLists).sort();
    sortedLists.forEach(name => {
        const list = savedLists[name];
        const option = document.createElement('option');
        option.value = name;
        option.textContent = `${name} (${list.taskCount} tasks)`;
        loadListDropdown.appendChild(option);
    });

    // Restore previous selection if it still exists
    if (currentValue && sortedLists.includes(currentValue)) {
        loadListDropdown.value = currentValue;
    } else {
        loadListDropdown.value = '';
        document.getElementById('deleteSavedBtn').style.display = 'none';
    }
}

/**
 * Handle reset button
 */
function handleReset() {
    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.value = '';
    }

    appState.tasks = [];
    appState.positions = {};
    appState.taskCount = 0;
    appState.optimizer = null;
    appState.optimizationResult = null;

    // Reset UI
    updateCurrentOrderDisplay();
    document.getElementById('optimizedOrderList').innerHTML = '<p class="empty-state">Run ACO optimization to see results.</p>';
    document.getElementById('statsContainer').innerHTML = '<p class="empty-state">Awaiting optimization...</p>';
    document.getElementById('explanation').innerHTML = 'The ACO algorithm explores possible task orderings by simulating a colony of ants. Each ant builds a tour by probabilistically choosing the next task based on pheromone trails (previous solutions) and heuristic information (distance). Over iterations, ants converge on the best ordering.';

    if (appState.visualization) {
        appState.visualization.reset();
    }

    console.log('🔄 App reset');
}

/**
 * Handle toggle advanced panel
 */
function handleToggleAdvanced() {
    const advancedPanel = document.getElementById('advancedPanel');
    const toggleBtn = document.getElementById('toggleAdvanced');

    if (advancedPanel.classList.contains('collapsed')) {
        advancedPanel.classList.remove('collapsed');
        toggleBtn.innerHTML = '⚙️ Advanced ACO Parameters ▲';
    } else {
        advancedPanel.classList.add('collapsed');
        toggleBtn.innerHTML = '⚙️ Advanced ACO Parameters ▼';
    }
}

/**
 * Show loading overlay with animation
 */
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Handle canvas hover for task tooltips
 */
function setupCanvasHover() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    canvas.addEventListener('mousemove', (e) => {
        if (appState.taskCount === 0) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const nodeRadius = 18;
        let hoveredTaskIdx = -1;

        for (let i = 0; i < appState.taskCount; i++) {
            const pos = appState.positions[i];
            const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);

            if (dist < nodeRadius + 5) {
                hoveredTaskIdx = i;
                // Could show tooltip here
                break;
            }
        }

        canvas.style.cursor = hoveredTaskIdx >= 0 ? 'pointer' : 'crosshair';
    });
}

// Initialize canvas hover on load
document.addEventListener('DOMContentLoaded', setupCanvasHover);

/**
 * Handle window resize - regenerate task positions for responsive canvas
 */
function handleWindowResize() {
    const canvas = document.getElementById('canvas');
    if (!canvas || appState.taskCount === 0) return;

    const newWidth = canvas.offsetWidth;
    const newHeight = canvas.offsetHeight;

    if (newWidth > 0 && newHeight > 0) {
        // Regenerate positions with new canvas dimensions
        appState.positions = generateTaskPositions(appState.taskCount, newWidth, newHeight);

        if (appState.optimizer && appState.distMatrix) {
            // Rebuild distance matrix if optimization already ran
            appState.distMatrix = buildDistanceMatrix(appState.positions, appState.taskCount);
        }

        // Reset visualization with new positions
        if (appState.visualization) {
            appState.visualization = new VisualizationEngine(canvas, appState.positions, appState.taskCount, appState.tasks);
        }
    }
}

// Debounced resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleWindowResize, 300);
});
