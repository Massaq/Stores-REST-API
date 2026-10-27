from marshmallow import Schema, fields

from schemas.item import ItemSchema, ItemWithoutTagsSchema


class TagWithoutItemsSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)


class TagSchema(TagWithoutItemsSchema):
    items = fields.List(fields.Nested(ItemWithoutTagsSchema), dump_only=True)


class TagUpdateSchema(Schema):
    item_id = fields.Int(required=False)


class TagAndItemSchema(Schema):
    message = fields.Str()
    item = fields.Nested(ItemSchema)
    tag = fields.Nested(TagSchema)
