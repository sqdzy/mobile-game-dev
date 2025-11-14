from functools import wraps
from typing import Callable, Optional

from flask import current_app, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

from .database import db
from .models import Profile, User


def _get_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="mobile-dev-game")


def generate_token(user_id: int) -> str:
    serializer = _get_serializer()
    return serializer.dumps({"user_id": user_id})


def verify_token(token: str) -> Optional[User]:
    serializer = _get_serializer()
    max_age = current_app.config["TOKEN_MAX_AGE"]
    try:
        data = serializer.loads(token, max_age=max_age)
        user_id = data.get("user_id")
        if user_id is None:
            return None
        return User.query.get(user_id)
    except (BadSignature, SignatureExpired):
        return None


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def check_password(password_hash: str, password: str) -> bool:
    return check_password_hash(password_hash, password)


def token_required(fn: Callable):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if header.lower().startswith("bearer "):
            token = header.split(" ", 1)[1]
        else:
            token = None

        if not token:
            return jsonify({"message": "Authentication required"}), 401

        user = verify_token(token)
        if not user:
            return jsonify({"message": "Invalid or expired token"}), 401

        return fn(user, *args, **kwargs)

    return wrapper


def upsert_profile(user: User, coins: int, upgrades: str, stats: str) -> Profile:
    profile = user.profile or Profile(user=user)
    profile.coins = max(0, int(coins))
    profile.upgrades_snapshot = upgrades
    profile.stats_snapshot = stats
    db.session.add(profile)
    db.session.commit()
    return profile
