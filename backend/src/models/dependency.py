from src.extensions import db

class Dependency(db.Model):
    __tablename__ = "dependencies"

    id = db.Column(db.Integer, primary_key=True)
    predecessor_id = db.Column(db.Integer, db.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    successor_id = db.Column(db.Integer, db.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("predecessor_id", "successor_id", name="uq_dependency_pair"),
    )

    predecessor = db.relationship("Task", foreign_keys=[predecessor_id], backref="predecessor_links")
    successor = db.relationship("Task", foreign_keys=[successor_id], backref="successor_links")

    def __repr__(self):
        return f"<Dependency {self.predecessor_id} -> {self.successor_id}>"