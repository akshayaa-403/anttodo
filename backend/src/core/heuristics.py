from typing import List, Dict, Any
import math

def compute_heuristic_matrix(
    task_ids: List[int],
    tasks_map: Dict[int, Dict[str, Any]],
    dependencies: List[tuple]
) -> Dict[int, Dict[int, float]]:
    """
    Returns heuristic eta(i, j) – desirability of placing j after i.
    Higher = more desirable.
    """
    eta = {i: {} for i in task_ids}

    # Build dependency graph for quick checks
    pred_map = {i: set() for i in task_ids}
    succ_map = {i: set() for i in task_ids}
    for pred, succ in dependencies:
        pred_map[succ].add(pred)
        succ_map[pred].add(succ)

    for i in task_ids:
        for j in task_ids:
            if i == j:
                eta[i][j] = 0.0
                continue

            # Basic desirability: urgency of j
            urgency_j = tasks_map[j].get("urgency_score", 5) / 10.0

            # Penalize if j has unmet dependencies (i.e., i is not a predecessor)
            # If j depends on something, but that something is not in the path, we reduce heuristic.
            # Actually, the transition rule only allows *feasible* next tasks, so we skip this here.

            # Reward alternating mental load
            load_i = tasks_map[i].get("mental_load", 5)
            load_j = tasks_map[j].get("mental_load", 5)
            # We want to avoid high-load clusters: if j is low and i is high, give bonus.
            load_complement = 0.0
            if load_i > 7 and load_j < 4:
                load_complement = 0.3
            elif load_i < 4 and load_j > 7:
                load_complement = 0.2

            # Reward if j has a deadline and it's soon
            deadline_bonus = 0.0
            if tasks_map[j].get("deadline"):
                # Higher bonus for urgent deadlines
                deadline_bonus = (urgency_j * 0.2)

            eta[i][j] = urgency_j + load_complement + deadline_bonus + 0.1  # base

    return eta