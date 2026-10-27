import os
from collections.abc import Generator

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

import pytest
from flask import Flask
from flask.testing import FlaskClient
from sqlalchemy.pool import StaticPool

import celery_app as celery_module
from app import app as flask_app
from db import db as _db

flask_app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "poolclass": StaticPool,
    "connect_args": {"check_same_thread": False},
}

celery_module.celery_app.conf.task_always_eager = True
celery_module.celery_app.conf.task_eager_propagates = True


@pytest.fixture
def app() -> Generator[Flask, None, None]:
    flask_app.config["TESTING"] = True
    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app: Flask) -> FlaskClient:
    return app.test_client()
