from celery import Celery
from src.config import settings

def make_celery():
    celery = Celery(
        "antplan",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
        include=["src.tasks.plan_tasks"],  # We will create this later
    )
    celery.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )
    return celery

celery = make_celery()