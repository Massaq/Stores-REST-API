import os

import redis
from celery import Celery
from dotenv import load_dotenv
from redis.exceptions import RedisError

load_dotenv()

broker_url: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
backend_url: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

celery_app: Celery = Celery(
    "stores_api",
    broker=broker_url,
    backend=backend_url,
)

celery_app.conf.imports = ("tasks",)

try:
    redis.Redis.from_url(broker_url).ping()
except RedisError:
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True