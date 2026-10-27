from flask.views import MethodView
from flask_smorest import Blueprint, abort

from models import StoreModel
from schemas import StoreSchema

blp = Blueprint("Stores", __name__, description="Operations on stores")


@blp.route("/store/<string:name>")
class Store(MethodView):
    @blp.response(200, StoreSchema)
    def get(self, name: str) -> StoreModel:
        store = StoreModel.find_by_name(name)
        if not store:
            abort(404, message="Store not found.")
        return store

    @blp.response(201, StoreSchema)
    def post(self, name: str) -> StoreModel:
        if StoreModel.find_by_name(name):
            abort(400, message=f"A store with name '{name}' already exists.")

        store = StoreModel(name=name)
        store.save_to_db()
        return store

    def delete(self, name: str) -> tuple[dict[str, str], int]:
        store = StoreModel.find_by_name(name)
        if not store:
            abort(404, message="Store not found.")

        store.delete_from_db()
        return {"message": "Store deleted"}, 200


@blp.route("/store")
class StoreList(MethodView):
    @blp.response(200, StoreSchema(many=True))
    def get(self) -> list[StoreModel]:
        return StoreModel.find_all()
