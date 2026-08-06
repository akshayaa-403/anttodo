# 🐜 Ants Solve Your To-Do List

> Watch a colony of virtual ants find the best order for your tasks, using Ant Colony Optimization.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit-brightgreen)](https://akshayaa-403.github.io/anttodo/)
![License](https://img.shields.io/badge/License-MIT-blue)
![Dependencies](https://img.shields.io/badge/dependencies-none-success)

An interactive visualizer that applies **Ant Colony Optimization** to task ordering. Ants crawl between your tasks, lay pheromone trails on the routes that work well, and converge on an optimal ordering in real time. Pure HTML, CSS and JavaScript in a single file — no build step, no dependencies.

**[▶ Try it live](https://akshayaa-403.github.io/anttodo/)**

---

## Two modes, one colony

The app ships with two problem formulations that share the same ACO engine. This distinction is the point of the project, so it's worth being precise about it.

### 📍 Errand Mode — a literal Traveling Salesman Problem

Tasks are **real places** with latitude and longitude. Distance is genuine haversine kilometres, the heuristic is `η = 1/km`, and the tour is **closed** (it returns home). This is textbook TSP, and the answer is objectively verifiable — a shorter route really is shorter.

### 🧠 Focus Mode — task sequencing

Here the colony optimizes the **order** of a workday against a cost function built from things that actually matter:

| Term                            | What it penalizes                                     |
| ------------------------------- | ----------------------------------------------------- |
| **Deadline pressure**     | Finishing a task after it was due, scaled by priority |
| **Priority inversion**    | Urgent work sitting late in the day                   |
| **Context switching**     | Bouncing between categories (work → home → work)    |
| **Cognitive-load timing** | Demanding work scheduled when energy has decayed      |

Each term has a slider, so you can decide what "better" means. Set one to zero to ignore it.

### Why not just scatter tasks randomly and call it TSP?

Because the answer would be meaningless. A common way to build this kind of demo is to place tasks at random 2D coordinates and find the shortest tour — it animates beautifully, but the "optimal" order is optimal only with respect to coordinates you invented. Reload the page, get new coordinates, get a different answer.

Focus Mode avoids this by optimizing against a cost function with real semantics. Errand Mode keeps the honest TSP claim by using real geography. Nothing here is a made-up distance.

**Dependencies apply to Focus Mode only.** A closed TSP tour has no start and no direction, so "X before Y" is undefined in a cycle. The constraint panel is disabled in Errand Mode rather than pretending otherwise.

---

## Features

- **Two visualizations** — watch individual ants crawl, or view the aggregate pheromone field as a weighted graph. Or both at once.
- **Live convergence chart** — best cost per iteration, so you can see the colony actually learning rather than take it on faith.
- **Full parameter control** — ants per iteration, iterations, α, β, ρ, q₀, animation speed, and 2-opt on/off.
- **Task dependencies** — declare "X must precede Y". Cycles are rejected before they can break the solver.
- **Before & after comparison** — your original order beside the optimized one, with a computed schedule and missed deadlines flagged.
- **Plain-English reasoning** — explains *why* the new order is better, derived from the actual objective terms rather than canned text.
- **Adjustable objective weights** — tune what the colony optimizes for.
- **Light and dark themes**, responsive layout, accessible controls.

---

## Running locally

```bash
git clone https://github.com/akshayaa-403/anttodo.git
cd anttodo
python -m http.server 8000# open index.html in your browser — that's it
```

---

## How the algorithm works

Each ant builds one complete ordering. At each step it picks the next task with probability

$$
P(i \to j) = \frac{[\tau_{ij}]^{\alpha} \cdot [\eta_{ij}]^{\beta}}{\sum_{l \in \text{allowed}} [\tau_{il}]^{\alpha} \cdot [\eta_{il}]^{\beta}}
$$

where **τ** is the pheromone deposited by previous ants, and **η** is the heuristic desirability of stepping from *i* to *j*. After every iteration, all trails evaporate by a factor of **ρ**, then the best-so-far ordering deposits `1/cost` on each of its edges. Good edges compound; bad ones fade.

### Parameters

| Symbol        | Meaning          | Effect                                                                                    |
| ------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| **α**  | Pheromone weight | High α = ants trust the colony's memory, converging faster but risking premature lock-in |
| **β**  | Heuristic weight | High β = ants act greedily on local cost, exploring less                                 |
| **ρ**  | Evaporation rate | High ρ = trails fade fast, keeping exploration alive but forgetting good routes          |
| **q₀** | Greediness       | Probability an ant takes the best-looking edge outright instead of sampling               |

### Implementation notes

Two details matter for correctness, and both are easy to get wrong:

**Max-Min Ant System.** Pheromone is clamped to `[τmin, τmax]`, with `τmax` tied to the current best cost. Without bounds, a single early trail compounds without limit and the colony stalls on the first decent answer it finds — the classic failure mode of naive ACO. Deposit comes from the global best only.

**Dependency-aware construction and 2-opt.** Ants only ever consider tasks whose prerequisites are already placed, so **every** solution is feasible by construction rather than repaired afterwards. The 2-opt local search re-validates the partial order before accepting any segment reversal, since reversing a segment can invert a dependency. Constraints are checked for cycles with Kahn's algorithm before being accepted.

The random number generator is a seeded `mulberry32`, so a given configuration reproduces exactly.

---

## Verification

The engine is covered by **101 assertions** across two suites, run headlessly in Node against the code **extracted from `index.html` itself** — so the tests exercise what actually ships, not a copy that might drift.

```bash
node test/run.js     # no dependencies needed
```

`test/engine.test.js` covers the algorithm; `test/ui.test.js` boots the entire page script against a stub DOM and drives the real event handlers, so wiring bugs surface too. They check, among other things:

- The colony finds the **known-optimal** tour on a square where the answer is provable by hand.
- It beats **best-of-500 random sampling** on larger instances.
- Best-so-far cost is **monotonically non-increasing** (a convergence guarantee).
- **Every ant in every iteration** respects every dependency — not just the final answer.
- Pheromone stays **finite and within `[τmin, τmax]`** after 150 iterations.
- Degenerate inputs don't crash: zero tasks, one task, identical coordinates, all weights zero, `α=β=0`, `ρ=0.9`, `q₀=1`, fully-chained dependencies.
- Task names are **HTML-escaped** (no XSS via a task title).
- Identical seeds reproduce identical results.

On the bundled sample day, Focus Mode improves the entered order by ~25% and rescues a missed deadline.

---

## Educational context

This project demonstrates:

- **Swarm intelligence** and emergent collective behaviour
- **Metaheuristic optimization** and its failure modes
- **Constraint handling** in permutation problems
- **Interactive visualization** of an algorithm's internal state
- **Real-time canvas rendering** and animation
- **Responsive web design** principles
- **Modern JavaScript** (ES6+, classes, typed arrays, closures)

Most importantly, it demonstrates the practice of **choosing an objective function that means something**. The gap between Focus Mode and a random-coordinate demo is the difference between optimization and decoration.

## License

MIT — see [LICENSE](LICENSE).
