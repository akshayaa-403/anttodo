import random
import math
from typing import List, Dict, Any, Tuple
from .ant import Ant
from .fitness import calculate_fitness
from .heuristics import compute_heuristic_matrix
from .local_search import apply_local_search

class ACOPlanner:
    def __init__(
        self,
        task_ids: List[int],
        tasks_map: Dict[int, Dict[str, Any]],
        dependencies: List[tuple],
        alpha: float = 1.0,
        beta: float = 2.0,
        rho: float = 0.1,
        n_ants: int = 10,
        n_iterations: int = 30,
        q0: float = 0.9
    ):
        self.task_ids = task_ids
        self.tasks_map = tasks_map
        self.dependencies = dependencies
        self.alpha = alpha
        self.beta = beta
        self.rho = rho
        self.n_ants = n_ants
        self.n_iterations = n_iterations
        self.q0 = q0

        # Initialize pheromone matrix
        self.pheromone = {i: {j: 0.1 for j in task_ids if i != j} for i in task_ids}

        # Pre-compute heuristic
        self.eta = compute_heuristic_matrix(task_ids, tasks_map, dependencies)

    def run(self) -> Tuple[List[int], float]:
        best_solution = None
        best_fitness = float('inf')

        for iteration in range(self.n_iterations):
            solutions = []
            fitnesses = []

            for _ in range(self.n_ants):
                ant = Ant(self.task_ids, self.dependencies, self.alpha, self.beta)
                seq = ant.construct_solution(self.pheromone, self.eta)

                # Apply local search to improve this ant's solution
                seq = apply_local_search(seq, self.tasks_map, self.dependencies)

                fitness = calculate_fitness(seq, self.tasks_map)
                solutions.append(seq)
                fitnesses.append(fitness)

                if fitness < best_fitness:
                    best_fitness = fitness
                    best_solution = seq[:]

            # Evaporate pheromone
            for i in self.task_ids:
                for j in self.task_ids:
                    if i != j:
                        self.pheromone[i][j] *= (1 - self.rho)

            # Deposit pheromone (only the best ant of this iteration)
            best_idx = min(range(len(fitnesses)), key=lambda idx: fitnesses[idx])
            best_seq_iter = solutions[best_idx]
            best_fitness_iter = fitnesses[best_idx]

            # Deposit proportionally to fitness (lower fitness = better = more pheromone)
            deposit = 1.0 / (best_fitness_iter + 0.1)
            for idx in range(len(best_seq_iter) - 1):
                i = best_seq_iter[idx]
                j = best_seq_iter[idx + 1]
                self.pheromone[i][j] += deposit

            # Also deposit for the global best
            if best_solution:
                global_deposit = 1.0 / (best_fitness + 0.1)
                for idx in range(len(best_solution) - 1):
                    i = best_solution[idx]
                    j = best_solution[idx + 1]
                    self.pheromone[i][j] += global_deposit

        return best_solution, best_fitness