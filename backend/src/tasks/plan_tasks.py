from src.celery_app import celery
from src.services.planning_service import PlanningService

@celery.task
def generate_plan_task(tasks_data, dependencies, params):
    """
    Celery task that runs the ACO planner.
    """
    try:
        order, fitness = PlanningService.generate_plan(tasks_data, dependencies, params)
        return {
            "order": order,
            "fitness": fitness,
            "details": {
                "task_count": len(tasks_data),
                "dependency_count": len(dependencies)
            }
        }
    except Exception as e:
        raise RuntimeError(f"Planning failed: {str(e)}")