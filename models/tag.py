from __future__ import annotations

from typing import Any

from db import db


class TagModel(db.Model):
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=False, nullable=False)
    items = db.relationship("ItemModel", back_populates="tags", secondary="items_tags")

    def json(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "items": [item.name for item in self.items],
        }

    @classmethod
    def find_by_name(cls, name: str) -> TagModel | None:
        return cls.query.filter_by(name=name).first()

    @classmethod
    def find_all(cls) -> list[TagModel]:
        return list(cls.query.all())

    def save_to_db(self) -> None:
        db.session.add(self)
        db.session.commit()

    def delete_from_db(self) -> None:
        db.session.delete(self)
        db.session.commit()
