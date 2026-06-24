import random
from typing import List, Set, Dict, Any

class Ant:
    def __init__(self, task_ids: List[int], dependencies: List[tuple], alpha: float, beta: float):
        self.task_ids = task_ids
        self.dependencies = dependencies
        self.alpha = alpha
        self.beta = beta
        self.sequence = []
        self.pred_map = {i: set() for i in task_ids}
        for pred, succ in dependencies:
            self.pred_map[succ].add(pred)

    def _get_feasible_next(self, completed: Set[int]) -> List[int]:
        """Returns tasks whose all predecessors are completed."""
        feasible = []
        for task in self.task_ids:
            if task in completed:
                continue
            if self.pred_map[task].issubset(completed):
                feasible.append(task)
        return feasible

    def construct_solution(self, pheromone: Dict[int, Dict[int, float]], eta: Dict[int, Dict[int, float]]) -> List[int]:
        completed = set()
        self.sequence = []

        # Start with a random feasible task
        feasible = self._get_feasible_next(completed)
        if not feasible:
            return self.sequence

        current = random.choice(feasible)
        self.sequence.append(current)
        completed.add(current)

        while len(completed) < len(self.task_ids):
            feasible = self._get_feasible_next(completed)
            if not feasible:
                break  # cycle or error

            # Compute probabilities
            probabilities = []
            for j in feasible:
                tau = pheromone.get(current, {}).get(j, 0.1)
                heur = eta.get(current, {}).get(j, 0.1)
                prob = (tau ** self.alpha) * (heur ** self.beta)
                probabilities.append(prob)

            # If all zero, fallback to uniform
            if sum(probabilities) == 0:
                next_task = random.choice(feasible)
            else:
                # Roulette wheel
                total = sum(probabilities)
                r = random.uniform(0, total)
                cumsum = 0.0
                next_task = feasible[-1]
                for idx, task in enumerate(feasible):
                    cumsum += probabilities[idx]
                    if r <= cumsum:
                        next_task = task
                        break

            self.sequence.append(next_task)
            completed.add(next_task)
            current = next_task

        return self.sequence