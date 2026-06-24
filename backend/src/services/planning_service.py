from typing import List, Dict, Any, Tuple
from src.core.aco_planner import ACOPlanner
from src.services.dag_validator import validate_dag

class PlanningService:
    @staticmethod
    def generate_plan(
        tasks: List[Dict[str, Any]],
        dependencies: List[Tuple[int, int]],
        params: Dict[str, float] = None
    ) -> Tuple[List[int], float]:
        """
        Converts DB tasks to ACO engine input, runs planner, returns order + fitness.
        """
        if not tasks:
            return [], 0.0

        task_ids = [t["id"] for t in tasks]
        # Validate DAG
        if not validate_dag(task_ids, dependencies):
            raise ValueError("Dependency graph contains a cycle.")

        # Build tasks_map for the ACO engine
        tasks_map = {t["id"]: t for t in tasks}

        # Default hyperparameters
        alpha = params.get("alpha", 1.0) if params else 1.0
        beta = params.get("beta", 2.0) if params else 2.0
        rho = params.get("rho", 0.1) if params else 0.1
        n_ants = params.get("n_ants", 10) if params else 10
        n_iterations = params.get("n_iterations", 30) if params else 30

        planner = ACOPlanner(
            task_ids=task_ids,
            tasks_map=tasks_map,
            dependencies=dependencies,
            alpha=alpha,
            beta=beta,
            rho=rho,
            n_ants=n_ants,
            n_iterations=n_iterations
        )

        order, fitness = planner.run()
        return order, fitness