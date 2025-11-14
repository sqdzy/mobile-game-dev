import json
from typing import Any, Dict

from flask import Blueprint, jsonify, request

from .auth import check_password, generate_token, hash_password, token_required, upsert_profile
from .database import db
from .models import Profile, User

api_bp = Blueprint("api", __name__)


def _parse_payload() -> Dict[str, Any]:
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return {}
    return payload


@api_bp.route("/health", methods=["GET"])
def healthcheck():
    return jsonify({"status": "ok"})


@api_bp.route("/register", methods=["POST"])
def register():
    payload = _parse_payload()
    nickname = (payload.get("nickname") or "").strip()
    password = payload.get("password") or ""

    if len(nickname) < 3 or len(password) < 6:
        return jsonify({"message": "Nickname or password is too short"}), 400

    existing = User.query.filter_by(nickname=nickname).first()
    if existing:
        return jsonify({"message": "Nickname already taken"}), 409

    user = User(nickname=nickname, password_hash=hash_password(password))
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id)
    profile = user.profile
    return jsonify({
        "token": token,
        "nickname": user.nickname,
        "profile": {
            "nickname": user.nickname,
            "coins": profile.coins,
            "upgrades": json.loads(profile.upgrades_snapshot or "{}"),
            "stats": json.loads(profile.stats_snapshot or "{}"),
            "updatedAt": profile.updated_at.isoformat() if profile.updated_at else None,
        },
    })


@api_bp.route("/login", methods=["POST"])
def login():
    payload = _parse_payload()
    nickname = (payload.get("nickname") or "").strip()
    password = payload.get("password") or ""

    user = User.query.filter_by(nickname=nickname).first()
    if not user or not check_password(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = generate_token(user.id)
    profile = user.profile
    return jsonify({
        "token": token,
        "nickname": user.nickname,
        "profile": {
            "nickname": user.nickname,
            "coins": profile.coins,
            "upgrades": json.loads(profile.upgrades_snapshot or "{}"),
            "stats": json.loads(profile.stats_snapshot or "{}"),
            "updatedAt": profile.updated_at.isoformat() if profile.updated_at else None,
        },
    })


@api_bp.route("/profile", methods=["GET"])
@token_required
def profile(user: User):
    profile = user.profile
    return jsonify({
        "nickname": user.nickname,
        "coins": profile.coins,
        "upgrades": json.loads(profile.upgrades_snapshot or "{}"),
        "stats": json.loads(profile.stats_snapshot or "{}"),
        "updatedAt": profile.updated_at.isoformat() if profile.updated_at else None,
    })


@api_bp.route("/sync", methods=["POST"])
@token_required
def sync(user: User):
    payload = _parse_payload()
    coins = payload.get("coins", 0)
    upgrades = payload.get("upgrades", {})
    stats = payload.get("stats", {})

    try:
        upgrades_json = json.dumps(upgrades or {})
        stats_json = json.dumps(stats or {})
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid payload"}), 400

    profile = upsert_profile(user, coins, upgrades_json, stats_json)
    return jsonify({
        "nickname": user.nickname,
        "coins": profile.coins,
        "upgrades": json.loads(profile.upgrades_snapshot or "{}"),
        "stats": json.loads(profile.stats_snapshot or "{}"),
        "updatedAt": profile.updated_at.isoformat() if profile.updated_at else None,
    })


@api_bp.route("/leaderboard", methods=["GET"])
@token_required
def leaderboard(user: User):
    limit = min(int(request.args.get("limit", 25)), 100)
    rows = (
        Profile.query.join(User)
        .order_by(Profile.coins.desc(), Profile.updated_at.desc())
        .limit(limit)
        .all()
    )
    payload = [
        {
            "nickname": row.user.nickname,
            "coins": row.coins,
            "updatedAt": row.updated_at.isoformat() if row.updated_at else None,
        }
        for row in rows
    ]
    return jsonify({"entries": payload})
