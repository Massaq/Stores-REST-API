from typing import Any

from flask.views import MethodView
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from flask_smorest import Blueprint, abort
from passlib.hash import pbkdf2_sha256

from blocklist import add_jti_to_blocklist
from models import UserModel
from schemas import UserSchema
from tasks import send_user_registration_email

blp = Blueprint("Users", "users", description="Operations on users")


@blp.route("/register")
class UserRegister(MethodView):
    @blp.arguments(UserSchema)
    def post(self, user_data: dict[str, str]) -> tuple[dict[str, str], int]:
        if UserModel.find_by_username(user_data["username"]):
            abort(400, message="A user with that username already exists.")

        user = UserModel(
            username=user_data["username"],
            password=pbkdf2_sha256.hash(user_data["password"]),
        )
        user.save_to_db()

        send_user_registration_email.delay(user.username)

        return {"message": "User created successfully."}, 201


@blp.route("/login")
class UserLogin(MethodView):
    @blp.arguments(UserSchema)
    def post(self, user_data: dict[str, str]) -> tuple[dict[str, str], int]:
        user = UserModel.find_by_username(user_data["username"])

        if user and pbkdf2_sha256.verify(user_data["password"], user.password):
            access_token: str = create_access_token(
                identity=str(user.id), fresh=True
            )
            refresh_token: str = create_refresh_token(identity=str(user.id))
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
            }, 200

        abort(401, message="Invalid credentials.")


@blp.route("/logout")
class UserLogout(MethodView):
    @jwt_required()
    def post(self) -> tuple[dict[str, str], int]:
        jwt_data: dict[str, Any] = get_jwt()
        jti: str = str(jwt_data["jti"])
        add_jti_to_blocklist(jti)
        return {"message": "Successfully logged out"}, 200


@blp.route("/user/<int:user_id>")
class User(MethodView):
    @blp.response(200, UserSchema)
    def get(self, user_id: int) -> UserModel:
        user = UserModel.find_by_id(user_id)
        if not user:
            abort(404, message="User not found.")
        return user

    def delete(self, user_id: int) -> tuple[dict[str, str], int]:
        user = UserModel.find_by_id(user_id)
        if not user:
            abort(404, message="User not found.")
        user.delete_from_db()
        return {"message": "User deleted."}, 200


@blp.route("/refresh")
class TokenRefresh(MethodView):
    @jwt_required(refresh=True)
    def post(self) -> tuple[dict[str, str], int]:
        current_user: str = str(get_jwt_identity())
        new_token: str = create_access_token(identity=current_user, fresh=False)
        return {"access_token": new_token}, 200
