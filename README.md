# 🐜 Ant To-Do List

> Watch a colony of ants optimize your daily tasks using Ant Colony Optimization (ACO)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit-brightgreen)](https://akshayaa-403.github.io/anttodo/)
![License](https://img.shields.io/badge/License-MIT-blue)

A beautiful, interactive visualization that turns your to-do list into a Traveling Salesman Problem (TSP) and solves it with a swarm of virtual ants. Built with pure HTML5, CSS, and JavaScript.

### Task Management
- **Flexible task parsing** - handles multiple formats (numbered lists, bullets, plain text)
- **Priority & duration markers** - parse task importance and estimated time automatically
- **Live task preview** with visual cards showing emoji, priority, and duration
- **Individual task deletion** with easy delete buttons
- **Completion detection** for marked tasks (✅, [x], ☑, ~strikethrough~)

### Persistence & Lists
- **Save task lists to localStorage** with custom names
- **Load previously saved lists** from your "My Saved Lists" dropdown
- **List management** - view task counts and delete saved lists
- **Non-destructive updates** - reload old task sets without losing current work

### Advanced Options
- Adjustable ACO parameters with real-time labels:
  - **Number of ants** (5-100): More ants = more exploration
  - **Iterations** (10-200): More iterations = better convergence
  - **α** (pheromone weight): How much ants trust previous paths
  - **β** (heuristic weight): How much ants favor nearby tasks
  - **ρ** (evaporation rate): How quickly pheromone fades
  - **Q** (pheromone deposit): Strength of each ant's contribution
- Collapsible advanced panel to keep the UI clean

### Results & Analytics
- **Before & After task order comparison** side-by-side
- **Optimization metrics** including:
  - Route improvement percentage
  - Time optimized estimate
  - Urgency gain calculation
  - Number of iterations completed
- **Detailed explanation** of how the optimization worked

## Try It Now

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

## How Ant Colony Optimization Works

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

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

## Educational Context

This project demonstrates:
- **Swarm intelligence** and collective behavior
- **Metaheuristic optimization** algorithms
- **Interactive visualization** of algorithms
- **Real-time canvas rendering** and animations
- **Responsive web design** principles
- **Modern JavaScript** (ES6, async/await, closures)
