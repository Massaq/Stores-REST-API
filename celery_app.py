import os

from celery import Celery
from dotenv import load_dotenv


load_dotenv()

celery_app = Celery(
    "stores_api",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
)

celery_app.conf.imports = ("tasks",)