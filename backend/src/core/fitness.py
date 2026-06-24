from typing import List, Dict, Any
import math

def calculate_fitness(
    sequence: List[int],
    tasks_map: Dict[int, Dict[str, Any]],
    max_daily_minutes: int = 480
) -> float:
    """
    Lower fitness score is better.
    Penalizes: overdue tasks, high-mental-load clustering, exceeding daily capacity.
    """
    total_penalty = 0.0
    total_duration = 0

    for idx, task_id in enumerate(sequence):
        task = tasks_map[task_id]
        duration = task.get("duration_minutes", 30)
        total_duration += duration

        # 1. Overdue penalty (deadline vs position in sequence – approximated)
        # If we assume each task takes its duration, we calculate cumulative time.
        # For simplicity, we just check if index * avg_duration exceeds deadline.
        if task.get("deadline"):
            # Rough estimate: if the task appears after the 60% mark, it's risky.
            # We'll refine this with actual time slots later.
            position_ratio = idx / max(len(sequence), 1)
            urgency = task.get("urgency_score", 5)
            # If it's urgent and appears late, high penalty.
            if urgency > 7 and position_ratio > 0.6:
                total_penalty += urgency * (position_ratio - 0.6) * 10

        # 2. Mental load clustering penalty (avoid high-load back-to-back)
        if idx > 0:
            prev_task = tasks_map[sequence[idx - 1]]
            current_load = task.get("mental_load", 5)
            prev_load = prev_task.get("mental_load", 5)
            # Exponential penalty if both are high (> 6)
            if current_load > 6 and prev_load > 6:
                total_penalty += (current_load + prev_load) * 1.5
            # Mild penalty for big swings (ADHD often dislikes drastic switches)
            # Actually, some prefer switching. We'll keep it moderate.
            total_penalty += abs(current_load - prev_load) * 0.1

        # 3. Duration overflow (schedule must fit in a day)
        if total_duration > max_daily_minutes:
            overflow = total_duration - max_daily_minutes
            total_penalty += overflow * 0.5

    return total_penalty