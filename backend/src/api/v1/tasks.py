from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models.task import Task
from src.schemas.task import TaskCreate, TaskUpdate  # We'll define these later

bp = Blueprint("tasks", __name__, url_prefix="/api/v1/tasks")

@bp.route("/", methods=["GET"])
def list_tasks():
    tasks = Task.query.filter_by(is_archived=False).all()
    return jsonify([{
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "urgency_score": t.urgency_score,
        "mental_load": t.mental_load,
        "duration_minutes": t.duration_minutes,
        "deadline": t.deadline.isoformat() if t.deadline else None,
        "is_archived": t.is_archived
    } for t in tasks])

@bp.route("/", methods=["POST"])
def create_task():
    data = request.get_json()
    # Basic validation (we'll use Pydantic later)
    task = Task(
        title=data["title"],
        description=data.get("description"),
        urgency_score=data.get("urgency_score", 5.0),
        mental_load=data.get("mental_load", 5.0),
        duration_minutes=data.get("duration_minutes", 30),
        deadline=data.get("deadline")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"id": task.id, "message": "Task created"}), 201

@bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    task.title = data.get("title", task.title)
    task.description = data.get("description", task.description)
    task.urgency_score = data.get("urgency_score", task.urgency_score)
    task.mental_load = data.get("mental_load", task.mental_load)
    task.duration_minutes = data.get("duration_minutes", task.duration_minutes)
    task.deadline = data.get("deadline", task.deadline)
    db.session.commit()
    return jsonify({"message": "Task updated"})

@bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.is_archived = True
    db.session.commit()
    return jsonify({"message": "Task archived"})