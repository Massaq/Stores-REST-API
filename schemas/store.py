from marshmallow import Schema, fields

from schemas.item import ItemWithoutStoreSchema


class StoreWithoutItemsSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)


class StoreSchema(StoreWithoutItemsSchema):
    items = fields.List(fields.Nested(ItemWithoutStoreSchema), dump_only=True)


StoreWitoutItemsSchema = StoreWithoutItemsSchema
