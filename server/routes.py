"""HTTP API routes for the Flask backend.

All routes in this module are mounted under the ``/api`` prefix by
:func:`server.app.create_app`.

Authentication:
    Protected routes require a Bearer token:

    ``Authorization: Bearer <token>``

Endpoints:
    - ``GET /health``: health check.
    - ``POST /register``: create a user and return token + profile.
    - ``POST /login``: authenticate and return token + profile.
    - ``GET /profile``: get current profile snapshot.
    - ``POST /sync``: upload local snapshot (coins/upgrades/stats).
    - ``GET /leaderboard``: get top profiles sorted by coins.

Examples:
    Health check:

    >>> # curl http://localhost:5000/api/health

    Register:

    >>> # curl -X POST http://localhost:5000/api/register \
    ... #   -H "Content-Type: application/json" \
    ... #   -d '{"nickname":"hero","password":"secret123"}'
"""

import json
from typing import Any, Dict

from flask import Blueprint, jsonify, request

from .auth import check_password, generate_token, hash_password, token_required, upsert_profile
from .database import db
from .models import Profile, User

api_bp = Blueprint("api", __name__)


def _parse_payload() -> Dict[str, Any]:
    """Parse JSON body into a dictionary.

    Returns:
        Dict[str, Any]: Parsed JSON object if the body is a JSON object, else an
        empty dictionary.

    Side Effects:
        Reads request body from :data:`flask.request`.
    """
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return {}
    return payload


@api_bp.route("/health", methods=["GET"])
def healthcheck():
    """Health check endpoint.

    Returns:
        flask.Response: JSON ``{"status": "ok"}``.
    """
    return jsonify({"status": "ok"})


@api_bp.route("/register", methods=["POST"])
def register():
    """Register a new user.

    Request JSON:
        - ``nickname`` (str): Minimum length 3.
        - ``password`` (str): Minimum length 6.

    Returns:
        flask.Response: JSON with keys ``token``, ``nickname``, ``profile``.

    Status Codes:
        200: User created.
        400: Nickname/password too short or malformed payload.
        409: Nickname already exists.

    Side Effects:
        Inserts a user into the database and creates a related profile.
    """
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
    """Authenticate an existing user.

    Request JSON:
        - ``nickname`` (str)
        - ``password`` (str)

    Returns:
        flask.Response: JSON with keys ``token``, ``nickname``, ``profile``.

    Status Codes:
        200: Authenticated.
        401: Invalid credentials.
    """
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
    """Get the authenticated user's profile snapshot.

    Args:
        user: Injected by :func:`server.auth.token_required`.

    Returns:
        flask.Response: JSON profile snapshot.
    """
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
    """Upload and persist a profile snapshot.

    Request JSON:
        - ``coins`` (number): Will be coerced to ``int`` and clamped to ``>= 0``.
        - ``upgrades`` (object): JSON object.
        - ``stats`` (object): JSON object.

    Args:
        user: Injected by :func:`server.auth.token_required`.

    Returns:
        flask.Response: JSON profile snapshot after persistence.

    Status Codes:
        200: Snapshot saved.
        400: Invalid JSON payload (non-serializable upgrades/stats).

    Side Effects:
        Writes to the database.
    """
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
    """Return the leaderboard.

    Query Params:
        limit: Max number of entries to return (default 25, max 100).

    Args:
        user: Injected by :func:`server.auth.token_required`.

    Returns:
        flask.Response: JSON ``{"entries": [...]}`` sorted by coins desc.

    Side Effects:
        Performs a database query.
    """
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
