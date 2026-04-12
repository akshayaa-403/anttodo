# 🐜 Ant To-Do List – ACO Powered

A visually stunning, single-page web application that uses **Ant Colony Optimization (ACO)** to intelligently reorder your daily tasks. Watch virtual ants explore thousands of possible orderings in real time, uncovering the optimal sequence for your responsibilities.

## 🎯 Core Concept

Think of your to-do list as cities on a map. A colony of digital ants scouts every possible route, leaving pheromone trails on the best paths they discover. Over multiple iterations, these ants collectively converge on the **shortest, most efficient order** through your tasks—just like real ant colonies find food sources optimally.

### What Makes This App Special
- **Zero Dependencies**: Pure HTML5, CSS3, and ES6+ JavaScript. No frameworks, no npm, just open `index.html` and go.
- **Live Visualization**: Watch 25 animated ants march along pheromone trails in real time.
- **Educational**: See actual ACO algorithm in action—understand optimization at a visceral level.
- **Production-Ready**: Beautiful dark UI, fully responsive, accessible, well-commented code.

---

## 🚀 How to Run

### Option 1: Direct Opening (simplest)
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start optimizing your tasks!

### Option 2: Live Server (VS Code)
1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. Browser opens with hot-reload enabled

---

## 🤔 What Is ACO? (In Simple Terms)

**Ant Colony Optimization** mimics how real ants solve problems:

1. **Scout Phase**: Multiple ants explore different paths, laying down pheromone trails as they go.
2. **Communication**: Stronger pheromone trails on shorter paths attract more ants (positive feedback).
3. **Convergence**: After many iterations, most ants follow the best path discovered.
4. **Result**: The colony converges on an excellent solution without any central coordination.

**For your to-do list**, ACO finds the order that minimizes "total distance" (interpreted as task-switching overhead, urgency, or complexity weights built into position-based "geography").

---

## ⚙️ How to Use the App

### Left Panel (Input)
- **Textarea**: Paste or type your numbered to-do list (one item per line)
  - Example:
    ```
    1. Reply to emails
    2. Fix bug in authentication
    3. Design new dashboard
    4. Meeting notes
    5. Update documentation
    ```
- **"Add Task"** buttons: Quickly add individual tasks
- **"Load Example Day"** button: Populate with a sample list to see the optimization in action

### Center (Visualization Canvas)
- **Nodes** (colored circles): Represent your tasks
- **Pheromone Trails** (dynamic lines): Show which paths ants are favoring
- **Animated Ants** (🐜 sprites): Watch them explore and converge
- **Hover on any task circle** to see the full task description

### Right Panel (Results)
- **Current Order**: Your original list
- **Optimized Order**: The best sequence found by the colony
- **Distance Saved**: Total improvement (percentage and absolute units)
- **Explanation**: Plain-English summary of what happened

### "Advanced ACO Parameters" (Collapsed by Default)
The app works perfectly with hard-coded defaults, but you can tweak if desired:
- **Number of Ants** (default: 25): More ants = more exploration, slower computation
- **Iterations** (default: 80): More iterations = better convergence
- **α (pheromone importance)** (default: 1.0): How much ants rely on previous paths
- **β (heuristic importance)** (default: 5.0): How much ants favor nearby tasks
- **Evaporation Rate** (default: 0.15): How quickly pheromone fades (enables exploring new paths)
- **Q (Pheromone deposit)** (default: 200): How much pheromone each ant deposits

---

## 🧬 Algorithm Details

### ACO Implementation: Ant System (AS)

The app implements the **classic Ant System** variant, optimized for the Traveling Salesman Problem (TSP) open path:

#### Key Formula: Probability of Task Transition

For ant *k* at task *i*, the probability of moving to task *j* (not yet visited):

$$P^k_{ij} = \frac{[\tau_{ij}]^\alpha \cdot [\eta_{ij}]^\beta}{\sum_{l \notin \text{visited}} [\tau_{il}]^\alpha \cdot [\eta_{il}]^\beta}$$

Where:
- **τ_ij**: Pheromone level on edge (i, j)
- **η_ij**: Heuristic value (1 / distance)
- **α**: Pheromone importance weight
- **β**: Heuristic importance weight

#### Pheromone Update (Global Best Strategy)

After each iteration:

$$\tau_{ij} \leftarrow (1 - \rho) \tau_{ij} + \sum_{k=1}^{m} \Delta\tau^k_{ij}$$

Where:
- **ρ**: Evaporation rate (0.15)
- **Δτ^k_ij**: Pheromone deposited by ant *k* on edge (i, j)
- **Δτ^k_ij = Q / L_k** if ant *k* traversed (i, j); else 0 (Q = 200)
- **Elitist addition**: Best ant deposits 2× pheromone bonus

#### Initialization

- **Initial pheromone**: τ₀ = 1 / (n × L_nn)
- **L_nn**: Length of nearest-neighbor tour (heuristic baseline)
- **Ensures balanced exploration** from the start

---

## 📊 Default Parameters Explained

| Parameter         | Default | Why This Value?                                             |
|-------------------|---------|-------------------------------------------------------------|
| # of Ants         | 25      | Balances exploration speed with responsiveness             |
| # of Iterations   | 80      | Good convergence for 5–15 tasks; fast enough (< 2 sec)    |
| α (pheromone)     | 1.0     | Equal weight to pheromone; prevents premature convergence  |
| β (heuristic)     | 5.0     | Ants slightly favor closer tasks (5× heuristic weight)     |
| Evaporation (ρ)   | 0.15    | 15% fade per iteration; enables re-exploration             |
| Q (pheromone qty) | 200     | Tuned for visible, stable trails on canvas                 |
| τ₀ (initial)      | 1/(n×L_nn) | Normalized to task count and baseline tour length    |

---

## 🎨 Visuals & UX

- **Dark Ant Colony Theme**: Deep forest green, warm earth tones, jet black
- **Real-Time Canvas**: 25 ants animated in parallel with pheromone trails
- **Loading Overlay**: Animated scout ants + progress bar + iteration counter
- **Responsive Design**: Works beautifully on desktop (1920px), tablet (768px), and mobile (375px+)
- **Accessibility**: High contrast, keyboard navigable, semantic HTML
- **Animations**: Smooth transitions, micro-feedback on interactions, confetti-like final celebration

---

## 📁 Project Structure

```
ant-to-do-list/
├── index.html              # Main HTML (navbar, panels, canvas)
├── css/
│   └── styles.css          # All styling (grid, animations, dark theme)
├── js/
│   ├── main.js             # Controller (runs orchestration)
│   ├── aco.js              # ACO algorithm (Ant System implementation)
│   ├── visualization.js    # Canvas rendering & animations
│   └── utils.js            # Helpers (seeded RNG, distance, formatting)
├── assets/                 # (Optional) SVG icons or images
└── README.md               # This file
```

---

## 🛠️ Tech Stack & Why Vanilla JS

- **HTML5**: Semantic markup, canvas element for rendering
- **CSS3**: Grid/flexbox layouts, CSS animations (keyframes), transitions
- **ES6+ JavaScript**: Modern syntax (const/let, arrow functions, async/await)
  - No build step needed
  - No bundle size bloat
  - Pure algorithm focuses on **educational clarity** over framework abstractions
  - **Performance**: Runs on main thread with small batches to keep UI responsive

**Why not React/Vue/etc.?**
- This project is a portfolio piece demonstrating algorithmic competence
- Vanilla code showcases problem-solving and optimization skills directly
- Single-file deployment (just open `index.html`)
- No npm dependencies = no supply chain vulnerabilities
- Smaller learning curve for someone reading the code

---

## 🔍 Algorithm Walkthrough (Code Example)

```javascript
// JS/aco.js snippet:
// Simplified probability calculation
const numerator = Math.pow(pheromone, alpha) * Math.pow(heuristic, beta);
const denominator = possibleTasks
  .map(task => Math.pow(pheromones[task], alpha) * getHeuristic(task, beta))
  .reduce((a, b) => a + b, 0);

probability[task] = numerator / denominator;
// Higher pheromone & closer neighbors = higher probability
```

---

## 💡 Common Questions

**Q: Why are my tasks in the same order after optimization?**
> Tasks that are naturally good in sequence (based on their generated positions & distances) might already be optimal. The algorithm ensures this is the *best* ordering.

**Q: Can I run this offline?**
> Yes! Completely offline. No external APIs, CDNs, or internet required.

**Q: How many tasks can I optimize?**
> 3–20 recommended. The app warns above 20. More tasks = longer computation (O(n²) distance matrix).

**Q: Can I modify the algorithm?**
> Absolutely! It's well-commented. Edit `js/aco.js` to experiment with parameters or variants (e.g., swarm size, evaporation, heuristic).

---

## 🎓 Educational Value

This project teaches:
- **Metaheuristic Algorithms**: See optimization beyond brute-force in action
- **Swarm Intelligence**: Decentralized problem-solving with emergent behavior
- **Computational Geometry**: Distance calculations & 2D coordinate systems
- **Canvas Rendering**: Real-time animation and dynamic visualization
- **Vanilla Web APIs**: requestAnimationFrame, HTML5 Canvas, ES6+ features
- **UI/UX Design**: Responsive layouts, micro-interactions, accessibility

---

## 🎉 Have Fun!

Paste your real to-do list, watch the colony work, and discover a fresh perspective on task ordering. Share it with friends and watch their jaws drop. 

**Made with 🐜 and ❤️**

---

## License

MIT – Feel free to use, modify, and share!
