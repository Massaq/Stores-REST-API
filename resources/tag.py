from typing import Any

from flask.views import MethodView
from flask_smorest import Blueprint, abort

from db import db
from models import ItemModel, TagModel
from schemas import TagAndItemSchema, TagSchema, TagUpdateSchema

blp = Blueprint("Tags", "tags", description="Operations on tags")


@blp.route("/tag/<string:name>")
class Tag(MethodView):
    @blp.response(200, TagSchema)
    def get(self, name: str) -> TagModel:
        tag = TagModel.find_by_name(name)
        if not tag:
            abort(404, message="Tag not found.")
        return tag

    @blp.arguments(TagUpdateSchema)
    @blp.response(201, TagSchema)
    def post(self, update_data: dict[str, Any], name: str) -> TagModel:
        if not update_data or "item_id" not in update_data:
            abort(400, message="Missing required field 'item_id' in JSON body.")

        tag = TagModel.find_by_name(name)
        if not tag:
            tag = TagModel(name=name)

        item = db.session.get(ItemModel, update_data["item_id"])
        if not item:
            abort(400, message="An item with this item_id doesn't exist.")

        tag.items.append(item)
        tag.save_to_db()
        return tag

    @blp.arguments(TagUpdateSchema, required=False)
    @blp.response(200, TagAndItemSchema)
    @blp.alt_response(
        202,
        description="Deletes a tag when it has no items and no item_id is passed in the body.",
        example={"message": "Tag deleted."},
        success=True,
    )
    @blp.alt_response(404, description="Tag not found")
    @blp.alt_response(
        400, description="Missing item_id in body when tag is associated to items."
    )
    def delete(
        self, tag_data: dict[str, Any] | None, name: str
    ) -> dict[str, Any]:
        tag = TagModel.find_by_name(name)
        if not tag:
            abort(404, message="Tag not found.")

        if tag_data and "item_id" in tag_data:
            item = db.session.get(ItemModel, tag_data["item_id"])
            if not item or item not in tag.items:
                abort(400, message="Item is not associated with this tag.")
            tag.items.remove(item)
            tag.save_to_db()
            return {
                "message": "Item removed from tag",
                "item": item,
                "tag": tag,
            }

        if not tag.items:
            tag.delete_from_db()
            return {"message": "Tag deleted."}

        abort(
            400,
            message="Could not delete tag. Make sure tag is not associated with any items, then try again.",
        )
