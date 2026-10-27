from typing import Any

from flask.views import MethodView
from flask_jwt_extended import get_jwt, jwt_required
from flask_smorest import Blueprint, abort

from models import ItemModel
from schemas import ItemSchema, ItemUpdateSchema

blp = Blueprint("Items", __name__, description="Operations on items")


@blp.route("/item/<string:name>")
class Item(MethodView):
    @jwt_required()
    @blp.response(200, ItemSchema)
    def get(self, name: str) -> ItemModel:
        item = ItemModel.find_by_name(name)
        if not item:
            abort(404, message="Item not found")
        return item

    @jwt_required(fresh=True)
    @blp.arguments(ItemSchema)
    @blp.response(201, ItemSchema)
    def post(self, item_data: dict[str, Any], name: str) -> ItemModel:
        if ItemModel.find_by_name(name):
            abort(400, message=f"An item with name '{name}' already exists.")

        item = ItemModel(**item_data, name=name)
        item.save_to_db()
        return item

    @jwt_required()
    def delete(self, name: str) -> dict[str, str]:
        jwt: dict[str, Any] = get_jwt()
        if not jwt.get("is_admin"):
            abort(401, message="Admin privilege required.")

        item = ItemModel.find_by_name(name)
        if not item:
            abort(404, message="Item not found.")

        item.delete_from_db()
        return {"message": "Item deleted."}

    @blp.arguments(ItemUpdateSchema)
    @blp.response(200, ItemSchema)
    def put(self, item_data: dict[str, Any], name: str) -> ItemModel:
        item = ItemModel.find_by_name(name)

        if item:
            item.price = item_data["price"]
            if "store_id" in item_data:
                item.store_id = item_data["store_id"]
        else:
            item = ItemModel(name=name, **item_data)

        item.save_to_db()
        return item


@blp.route("/item")
class ItemList(MethodView):
    @jwt_required()
    @blp.response(200, ItemSchema(many=True))
    def get(self) -> list[ItemModel]:
        return ItemModel.find_all()
