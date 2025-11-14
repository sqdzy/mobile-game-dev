from datetime import datetime
from typing import Dict, Any

from sqlalchemy import event

from .database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(40), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    profile = db.relationship(
        "Profile",
        uselist=False,
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Profile(db.Model):
    __tablename__ = "profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    coins = db.Column(db.Integer, default=0)
    upgrades_snapshot = db.Column(db.Text, default="{}")
    stats_snapshot = db.Column(db.Text, default="{}")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="profile")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nickname": self.user.nickname,
            "coins": self.coins,
            "upgrades": self.upgrades_snapshot,
            "stats": self.stats_snapshot,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


@event.listens_for(User, "after_insert")
def create_profile_after_user_insert(mapper, connection, target: User):
    profile_table = Profile.__table__
    connection.execute(
        profile_table.insert().values(user_id=target.id, coins=0, upgrades_snapshot="{}", stats_snapshot="{}")
    )
