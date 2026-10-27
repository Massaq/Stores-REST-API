import os
from typing import Any

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, redirect
from flask_jwt_extended import JWTManager
from flask_smorest import Api
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.pool import StaticPool
from werkzeug.exceptions import HTTPException

import models
from blocklist import is_jti_blocklisted
from db import db
from resources.item import blp as ItemBlueprint
from resources.store import blp as StoreBlueprint
from resources.tag import blp as TagBlueprint
from resources.user import blp as UserBlueprint

load_dotenv()


def resolve_database_uri(db_url: str | None = None) -> str:
    candidate: str = db_url or os.getenv("DATABASE_URL", "sqlite:///data.db")
    if not candidate or candidate.startswith("sqlite"):
        return candidate or "sqlite:///data.db"
    try:
        engine = create_engine(candidate)
        with engine.connect():
            pass
        engine.dispose()
        return candidate
    except OperationalError:
        return "sqlite:///data.db"


def register_jwt_callbacks(jwt_manager: JWTManager) -> None:
    @jwt_manager.additional_claims_loader
    def add_claims_to_jwt(identity: str | int) -> dict[str, bool]:
        if str(identity) == "1":
            return {"is_admin": True}
        return {"is_admin": False}

    @jwt_manager.token_in_blocklist_loader
    def check_if_token_in_blocklist(
        jwt_header: dict[str, Any], jwt_payload: dict[str, Any]
    ) -> bool:
        return is_jti_blocklisted(str(jwt_payload["jti"]))

    @jwt_manager.expired_token_loader
    def expired_token_callback(
        jwt_header: dict[str, Any], jwt_payload: dict[str, Any]
    ) -> tuple[Response, int]:
        return (
            jsonify(
                {"message": "The token has expired.", "error": "token_expired"}
            ),
            401,
        )

    @jwt_manager.invalid_token_loader
    def invalid_token_callback(error: str) -> tuple[Response, int]:
        return (
            jsonify(
                {
                    "message": "Signature verification failed.",
                    "error": "invalid_token",
                }
            ),
            401,
        )

    @jwt_manager.unauthorized_loader
    def missing_token_callback(error: str) -> tuple[Response, int]:
        return (
            jsonify(
                {
                    "description": "Request does not contain an access token.",
                    "error": "authorization_required",
                }
            ),
            401,
        )

    @jwt_manager.needs_fresh_token_loader
    def token_not_fresh_callback(
        jwt_header: dict[str, Any], jwt_payload: dict[str, Any]
    ) -> tuple[Response, int]:
        return (
            jsonify(
                {
                    "description": "The token is not fresh.",
                    "error": "fresh_token_required",
                }
            ),
            401,
        )

    @jwt_manager.revoked_token_loader
    def revoked_token_callback(
        jwt_header: dict[str, Any], jwt_payload: dict[str, Any]
    ) -> tuple[Response, int]:
        return (
            jsonify(
                {
                    "description": "The token has been revoked.",
                    "error": "token_revoked",
                }
            ),
            401,
        )


def register_error_handlers(flask_app: Flask) -> None:
    @flask_app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException) -> tuple[Response, int]:
        status_code: int = error.code or 500
        payload: dict[str, Any] = {
            "code": status_code,
            "status": error.name,
            "message": error.description,
        }
        error_data: Any = getattr(error, "data", None)
        if isinstance(error_data, dict):
            if "message" in error_data:
                payload["message"] = error_data["message"]
            if "messages" in error_data:
                payload["errors"] = error_data["messages"]
            for key, value in error_data.items():
                if key not in payload:
                    payload[key] = value
        return jsonify(payload), status_code

    @flask_app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_exception(
        error: SQLAlchemyError,
    ) -> tuple[Response, int]:
        db.session.rollback()
        return (
            jsonify(
                {
                    "code": 500,
                    "status": "Internal Server Error",
                    "message": "An unexpected database error occurred.",
                }
            ),
            500,
        )

    @flask_app.errorhandler(Exception)
    def handle_unexpected_exception(error: Exception) -> tuple[Response, int]:
        db.session.rollback()
        return (
            jsonify(
                {
                    "code": 500,
                    "status": "Internal Server Error",
                    "message": "An unexpected internal server error occurred.",
                }
            ),
            500,
        )


def create_app(db_url: str | None = None) -> Flask:
    flask_app = Flask(__name__)
    resolved_uri: str = resolve_database_uri(db_url)

    flask_app.config["API_TITLE"] = "Stores REST API"
    flask_app.config["API_VERSION"] = "v1"
    flask_app.config["OPENAPI_VERSION"] = "3.0.3"
    flask_app.config["OPENAPI_URL_PREFIX"] = "/"
    flask_app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger-ui"
    flask_app.config["OPENAPI_SWAGGER_UI_URL"] = (
        "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
    )
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = resolved_uri
    flask_app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    flask_app.config["PROPAGATE_EXCEPTIONS"] = True
    flask_app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY", "dev-only-change-me"
    )

    if resolved_uri == "sqlite:///:memory:":
        flask_app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
            "poolclass": StaticPool,
            "connect_args": {"check_same_thread": False},
        }

    db.init_app(flask_app)
    api = Api(flask_app)
    jwt_manager = JWTManager(flask_app)

    register_jwt_callbacks(jwt_manager)
    register_error_handlers(flask_app)

    @flask_app.get("/")
    def index() -> Response:
        return redirect("/swagger-ui")

    with flask_app.app_context():
        _ = models
        db.create_all()

    api.register_blueprint(UserBlueprint)
    api.register_blueprint(ItemBlueprint)
    api.register_blueprint(StoreBlueprint)
    api.register_blueprint(TagBlueprint)

    return flask_app


app: Flask = create_app()

if __name__ == "__main__":
    port: int = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)