# 🐜 Ant To-Do List

> Watch a colony of ants optimize your daily tasks using Ant Colony Optimization (ACO)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit-brightgreen)](https://akshayaa-403.github.io/anttodo/)
![License](https://img.shields.io/badge/License-MIT-blue)

A beautiful, interactive visualization that turns your to-do list into a Traveling Salesman Problem (TSP) and solves it with a swarm of virtual ants. Built with pure HTML5, CSS, and JavaScript.

## ✨ Core Features

### 🎨 Interactive Visualization
- **Real-time canvas visualization** with animated task nodes and connection edges
- **25+ animated ants** exploring different paths across your task network
- **Dynamic pheromone trails** that light up as ants find better paths
- **Marching ants animation** along high-pheromone trails during optimization
- **Highlighted optimal path** with glowing effect when optimization completes

### 📋 Task Management
- **Flexible task parsing** - handles multiple formats (numbered lists, bullets, plain text)
- **Priority & duration markers** - parse task importance and estimated time automatically
- **Live task preview** with visual cards showing emoji, priority, and duration
- **Individual task deletion** with easy delete buttons
- **Completion detection** for marked tasks (✅, [x], ☑, ~strikethrough~)

### 💾 Persistence & Lists
- **Save task lists to localStorage** with custom names
- **Load previously saved lists** from your "My Saved Lists" dropdown
- **List management** - view task counts and delete saved lists
- **Non-destructive updates** - reload old task sets without losing current work

### ⚙️ Advanced Options
- Adjustable ACO parameters with real-time labels:
  - **Number of ants** (5-100): More ants = more exploration
  - **Iterations** (10-200): More iterations = better convergence
  - **α** (pheromone weight): How much ants trust previous paths
  - **β** (heuristic weight): How much ants favor nearby tasks
  - **ρ** (evaporation rate): How quickly pheromone fades
  - **Q** (pheromone deposit): Strength of each ant's contribution
- Collapsible advanced panel to keep the UI clean

### 📊 Results & Analytics
- **Before & After task order comparison** side-by-side
- **Optimization metrics** including:
  - Route improvement percentage
  - Time optimized estimate
  - Urgency gain calculation
  - Number of iterations completed
- **Detailed explanation** of how the optimization worked

### 📱 Responsive & Accessible
- Fully responsive design for desktop, tablet, and mobile
- Canvas adapts to window resize with proper aspect ratio handling
- Inline validation messages instead of disruptive alerts
- Tooltips explaining each ACO parameter
- Semantic HTML with ARIA labels for accessibility

## 🚀 Try It Now

**Live Demo:** [https://akshayaa-403.github.io/anttodo/](https://akshayaa-403.github.io/anttodo/)

### Local Setup

No build process needed!

```bash
git clone https://github.com/akshayaa-403/anttodo.git
cd anttodo
# Open index.html in your browser
open index.html
```

Or use a local server:
```bash
python -m http.server 8000
# Then visit http://localhost:8000
```

## 🧬 How Ant Colony Optimization Works

The algorithm models your tasks as points in 2D space and finds the shortest path visiting all of them (TSP). Here's the magic:

### The Decision Formula
Each ant chooses the next unvisited task based on this probability:

$$P_{ij}^k = \frac{[\tau_{ij}]^\alpha \cdot [\eta_{ij}]^\beta}{\sum_{l \in allowed} [\tau_{il}]^\alpha \cdot [\eta_{il}]^\beta}$$

Where:
- **τ** (tau) = pheromone level on the edge (strength of previous solutions)
- **η** (eta) = heuristic value = 1/distance (prefer nearby tasks)
- **α** = controls pheromone importance (memory vs. exploration)
- **β** = controls distance importance (locality vs. exploration)
- **allowed** = set of unvisited tasks

### The Learning Process
1. All 25 ants build complete tours simultaneously
2. Each ant deposits pheromone proportional to tour quality (shorter = more deposit)
3. Pheromone evaporates everywhere by rate ρ
4. Ants repeat for N iterations
5. Early on: ants explore widely vs. later: colony converges on best paths

### Why It Works
- **Positive feedback**: Good edges accumulate pheromone → more ants use them
- **Negative feedback**: Poor edges lose pheromone → fewer ants use them
- **Emergence**: No central control, yet global optimization emerges from local decisions

## 📁 Project Structure

```
anttodo/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css         # Dark theme, responsive layout, animations
├── js/
│   ├── main.js            # App controller & event handlers
│   ├── aco.js             # Ant Colony Optimizer algorithm
│   ├── visualization.js   # Canvas rendering & animations
│   └── utils.js           # Parsing, storage, math utilities
├── README.md
├── LICENSE
└── .gitignore
```

## 🎯 What's New (Recent Updates)

- ✅ **Fixed task parsing** - handles "1)", "•", "1:", "- ", and more formats
- ✅ **Live task preview** - see changes instantly as you type
- ✅ **Inline validation** - friendly messages instead of alerts
- ✅ **Marching ants animation** - animated dashes show preferred paths
- ✅ **Canvas responsiveness** - proper sizing on window resize
- ✅ **Duplicate detection** - automatically removes duplicate tasks
- ✅ **Individual task deletion** - remove tasks without re-editing
- ✅ **Completion markers** - auto-detect ✅ [x] ☑ ~strikethrough~
- ✅ **localStorage persistence** - save & load task lists anytime

## 🚧 Planned Features

- 📊 **Convergence graph** - visualize how quickly the algorithm finds the best path
- 🎬 **Step-by-step mode** - animate each iteration so you can follow the algorithm
- 📤 **Export schedule** - save your optimized order as Markdown, JSON, or iCal
- 🎨 **Dark/light theme toggle** - respect user preferences
- 🔗 **Share links** - encode task lists in URL for easy sharing
- ⌨️ **Keyboard shortcuts** - Alt+O for optimize, Ctrl+S for save, etc.

## 🤝 Contributing

Ideas and contributions are welcome! Here are some ways you can help:

- Found a bug? [Open an issue](https://github.com/akshayaa-403/anttodo/issues)
- Have a feature request? Suggest it via an issue
- Want to improve the code? Fork and submit a pull request
- Have performance tips? Let's optimize for 50+ tasks

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

## 🎓 Educational Context

This project demonstrates:
- **Swarm intelligence** and collective behavior
- **Metaheuristic optimization** algorithms
- **Interactive visualization** of algorithms
- **Real-time canvas rendering** and animations
- **Responsive web design** principles
- **Modern JavaScript** (ES6, async/await, closures)

Perfect for learning about AI, algorithms, or just having fun watching ants solve your productivity problems! 🐜✨
