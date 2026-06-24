from typing import List, Set, Dict, Any
from .fitness import calculate_fitness

def two_opt_swap(sequence: List[int], i: int, k: int) -> List[int]:
    """Reverse the subsequence from i to k."""
    new_seq = sequence[:i] + sequence[i:k+1][::-1] + sequence[k+1:]
    return new_seq

def apply_local_search(
    sequence: List[int],
    tasks_map: Dict[int, Dict[str, Any]],
    dependencies: List[tuple],
    max_iters: int = 50
) -> List[int]:
    """
    2-opt local search on the sequence to improve fitness.
    Only accepts swaps that reduce fitness score.
    """
    best_seq = sequence[:]
    best_fitness = calculate_fitness(best_seq, tasks_map)

    # Build dependency sets for quick validation
    pred_map = {i: set() for i in tasks_map}
    for pred, succ in dependencies:
        pred_map[succ].add(pred)

    def is_valid(seq: List[int]) -> bool:
        """Check if sequence respects dependencies."""
        completed = set()
        for task in seq:
            if not pred_map[task].issubset(completed):
                return False
            completed.add(task)
        return True

    for _ in range(max_iters):
        improved = False
        for i in range(len(best_seq) - 2):
            for k in range(i + 1, len(best_seq) - 1):
                candidate = two_opt_swap(best_seq, i, k)
                if not is_valid(candidate):
                    continue
                candidate_fitness = calculate_fitness(candidate, tasks_map)
                if candidate_fitness < best_fitness:
                    best_seq = candidate
                    best_fitness = candidate_fitness
                    improved = True
                    break
            if improved:
                break
        if not improved:
            break

    return best_seq