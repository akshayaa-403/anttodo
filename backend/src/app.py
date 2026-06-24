from flask import Flask
from src.config import settings
from src.extensions import db, migrate, cors
from src.api.v1 import tasks, dependencies, plan

def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)

    app.register_blueprint(tasks.bp)
    app.register_blueprint(dependencies.bp)
    app.register_blueprint(plan.bp)

    @app.route("/health")
    def health():
        return {"status": "healthy", "env": settings.FLASK_ENV}

    return app

app = create_app()