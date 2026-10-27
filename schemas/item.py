from marshmallow import Schema, fields


class ItemSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, dump_only=True)
    price = fields.Float(required=True)
    store_id = fields.Int(required=True, load_only=True)
    store = fields.Nested("StoreWithoutItemsSchema", dump_only=True)
    tags = fields.List(fields.Nested("TagWithoutItemsSchema"), dump_only=True)


class ItemWithoutStoreSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, dump_only=True)
    price = fields.Float(required=True)
    tags = fields.List(fields.Nested("TagWithoutItemsSchema"), dump_only=True)


class ItemWithoutTagsSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, dump_only=True)
    price = fields.Float(required=True)
    store_id = fields.Int(required=True, load_only=True)
    store = fields.Nested("StoreWithoutItemsSchema", dump_only=True)


class ItemUpdateSchema(Schema):
    price = fields.Float(required=True)
    store_id = fields.Int(required=False)
