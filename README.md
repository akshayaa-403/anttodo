# Ant To-Do List

**Watch a colony of ants optimize your daily tasks using Ant Colony Optimization (ACO)**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit-brightgreen)](https://akshayaa-403.github.io/anttodo/)

A beautiful, interactive visualization that turns your to-do list into a Traveling Salesman Problem and solves it with a swarm of virtual ants.

## Features

- Clean dark-themed interface with ant-colony aesthetics
- Add your own tasks or load realistic examples
- Real-time animated visualization using HTML5 Canvas
  - 25 ants exploring paths
  - Dynamic pheromone trails (edges grow thicker and brighter)
  - Highlighted optimal path after optimization
- Adjustable ACO parameters:
  - Number of ants
  - Iterations
  - α (pheromone influence)
  - β (heuristic influence)
  - Evaporation rate
  - Q (pheromone deposit constant)
- Before & After task order comparison
- Optimization statistics (initial vs optimized distance, distance saved, convergence, etc.)
- Fully responsive design — works on desktop and mobile

## Try It Now

**Live Demo:** [https://akshayaa-403.github.io/anttodo/](https://akshayaa-403.github.io/anttodo/)

### Local Setup

```bash
git clone https://github.com/akshayaa-403/anttodo.git
cd anttodo
open index.html
```

## How It Works

The project models your tasks as points in a 2D space and treats finding the best sequence as a **Traveling Salesman Problem (TSP)**.

Ants construct tours using this probability formula:

$$P_{ij}^k = \frac{\tau_{ij}^\alpha \cdot \eta_{ij}^\beta}{\sum_{l} \tau_{il}^\alpha \cdot \eta_{il}^\beta}$$

Where:
- **τ** = pheromone level on the edge (learned over iterations)
- **η** = heuristic value (inverse of distance)
- **α** controls pheromone importance
- **β** controls distance/heuristic importance

Pheromone evaporates on poor paths and accumulates on better ones, allowing the colony to converge toward an optimal solution.

## 📁 Project Structure

```
anttodo/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── utils.js
│   ├── aco.js
│   ├── visualization.js
│   └── main.js
└── README.md
```

## 🤝 Contributing

Contributions and ideas are welcome! Possible improvements include:

- Continuous marching ants along the final optimal path
- Support for task priorities and deadlines in the heuristic
- Export optimized schedule (Markdown / JSON)
- Enhanced mobile experience
- Pheromone evaporation animation
- Performance optimizations for larger task lists

Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the **MIT License**.
