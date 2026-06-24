from typing import List, Tuple, Set

def validate_dag(task_ids: List[int], dependencies: List[Tuple[int, int]]) -> bool:
    """
    Returns True if the graph is acyclic (valid DAG).
    Uses Kahn's algorithm.
    """
    if not task_ids:
        return True

    # Build adjacency and indegree
    adj = {tid: set() for tid in task_ids}
    indegree = {tid: 0 for tid in task_ids}

    for pred, succ in dependencies:
        if pred not in task_ids or succ not in task_ids:
            return False
        if succ in adj[pred]:
            continue  # duplicate
        adj[pred].add(succ)
        indegree[succ] += 1

    # Kahn's algorithm
    queue = [tid for tid in task_ids if indegree[tid] == 0]
    processed = 0

    while queue:
        node = queue.pop()
        processed += 1
        for neighbor in adj[node]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    return processed == len(task_ids)

def detect_cycle(task_ids: List[int], dependencies: List[Tuple[int, int]]) -> bool:
    """Returns True if a cycle exists."""
    return not validate_dag(task_ids, dependencies)