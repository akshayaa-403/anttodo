from src.extensions import db
from datetime import datetime

class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    urgency_score = db.Column(db.Float, nullable=False, default=5.0)  # 0-10
    mental_load = db.Column(db.Float, nullable=False, default=5.0)    # 0-10
    duration_minutes = db.Column(db.Integer, nullable=False, default=30)
    deadline = db.Column(db.DateTime, nullable=True)
    is_archived = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Self-referential many-to-many for dependencies
    # This is the "successor" side (task depends on predecessors)
    dependencies = db.relationship(
        "Task",
        secondary="dependencies",
        primaryjoin="Task.id == dependencies.c.successor_id",
        secondaryjoin="Task.id == dependencies.c.predecessor_id",
        backref="dependents",
        lazy="dynamic"
    )

    def __repr__(self):
        return f"<Task {self.id}: {self.title}>"