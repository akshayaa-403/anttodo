from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models.task import Task
from src.models.dependency import Dependency
from src.services.dag_validator import validate_dag

bp = Blueprint("dependencies", __name__, url_prefix="/api/v1/dependencies")

@bp.route("/", methods=["GET"])
def list_dependencies():
    deps = Dependency.query.all()
    return jsonify([{
        "id": d.id,
        "predecessor_id": d.predecessor_id,
        "successor_id": d.successor_id
    } for d in deps])

@bp.route("/", methods=["POST"])
def add_dependency():
    data = request.get_json()
    pred_id = data.get("predecessor_id")
    succ_id = data.get("successor_id")
    if not pred_id or not succ_id:
        return jsonify({"error": "Missing predecessor_id or successor_id"}), 400
    if pred_id == succ_id:
        return jsonify({"error": "A task cannot depend on itself"}), 400

    # Check both tasks exist
    pred = Task.query.get(pred_id)
    succ = Task.query.get(succ_id)
    if not pred or not succ:
        return jsonify({"error": "Task not found"}), 404

    # Check if dependency already exists
    existing = Dependency.query.filter_by(predecessor_id=pred_id, successor_id=succ_id).first()
    if existing:
        return jsonify({"error": "Dependency already exists"}), 400

    # Check for cycles using the DAG validator
    # Get all tasks and existing dependencies (including the new one temporarily)
    all_tasks = Task.query.filter_by(is_archived=False).all()
    task_ids = [t.id for t in all_tasks]
    current_deps = [(d.predecessor_id, d.successor_id) for d in Dependency.query.all()]
    # Add the new dependency to check
    test_deps = current_deps + [(pred_id, succ_id)]
    if not validate_dag(task_ids, test_deps):
        return jsonify({"error": "This dependency would create a cycle"}), 400

    dep = Dependency(predecessor_id=pred_id, successor_id=succ_id)
    db.session.add(dep)
    db.session.commit()
    return jsonify({"id": dep.id, "message": "Dependency added"}), 201

@bp.route("/<int:dep_id>", methods=["DELETE"])
def delete_dependency(dep_id):
    dep = Dependency.query.get_or_404(dep_id)
    db.session.delete(dep)
    db.session.commit()
    return jsonify({"message": "Dependency removed"})