from flask import Blueprint, request, jsonify, current_app
from src.services.planning_service import PlanningService
from src.models.task import Task
from src.models.dependency import Dependency
from src.tasks.plan_tasks import generate_plan_task
import uuid

bp = Blueprint("plan", __name__, url_prefix="/api/v1/plan")

@bp.route("/generate", methods=["POST"])
def trigger_plan():
    """
    Async endpoint: starts Celery task and returns task_id.
    """
    params = request.get_json() or {}

    # Fetch all active tasks
    tasks = Task.query.filter_by(is_archived=False).all()
    if not tasks:
        return jsonify({"error": "No tasks found"}), 400

    # Fetch dependencies
    deps = Dependency.query.all()
    dependencies = [(d.predecessor_id, d.successor_id) for d in deps]

    # Convert tasks to dict format for the planning service
    tasks_data = [{
        "id": t.id,
        "title": t.title,
        "urgency_score": t.urgency_score,
        "mental_load": t.mental_load,
        "duration_minutes": t.duration_minutes,
        "deadline": t.deadline.isoformat() if t.deadline else None
    } for t in tasks]

    # Trigger Celery task
    task_id = str(uuid.uuid4())
    result = generate_plan_task.apply_async(
        args=[tasks_data, dependencies, params],
        task_id=task_id
    )

    return jsonify({"task_id": result.id}), 202

@bp.route("/status/<task_id>", methods=["GET"])
def get_plan_status(task_id):
    from src.celery_app import celery
    result = celery.AsyncResult(task_id)
    if result.ready():
        if result.successful():
            data = result.result
            return jsonify({
                "status": "completed",
                "order": data.get("order", []),
                "fitness": data.get("fitness", 0.0),
                "details": data.get("details", {})
            })
        else:
            return jsonify({"status": "failed", "error": str(result.info)}), 500
    else:
        return jsonify({"status": "pending"}), 202