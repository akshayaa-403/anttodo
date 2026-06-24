from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Flask
    FLASK_ENV: str = "development"
    SECRET_KEY: str = "dev-secret-change-me"

    # Databases
    DATABASE_URL: str = "postgresql://antplan:antplan123@db:5432/antplan"
    REDIS_URL: str = "redis://redis:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()