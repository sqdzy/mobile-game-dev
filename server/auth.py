"""Authentication and profile persistence helpers.

The backend uses:

- Password hashing via Werkzeug (PBKDF2 by default).
- Stateless signed tokens via :class:`itsdangerous.URLSafeTimedSerializer`.

Tokens are expected in the ``Authorization`` header using the Bearer scheme:

``Authorization: Bearer <token>``.

Notes:
    Token payload currently contains ``{"user_id": <int>}``.

    The token salt is hard-coded to ``"mobile-dev-game"``.
"""

from functools import wraps
from typing import Callable, Optional

from flask import current_app, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

from .database import db
from .models import Profile, User


def _get_serializer() -> URLSafeTimedSerializer:
    """Build a serializer bound to the current Flask app config.

    Returns:
        URLSafeTimedSerializer: Serializer configured with ``SECRET_KEY`` and salt.

    Raises:
        KeyError: If ``SECRET_KEY`` is missing in Flask config.

    Side Effects:
        Reads :data:`flask.current_app` configuration.
    """
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="mobile-dev-game")


def generate_token(user_id: int) -> str:
    """Generate a signed authentication token for a user.

    Args:
        user_id: Database identifier of the user.

    Returns:
        str: URL-safe signed token.
    """
    serializer = _get_serializer()
    return serializer.dumps({"user_id": user_id})


def verify_token(token: str) -> Optional[User]:
    """Verify a token and return the corresponding user.

    Args:
        token: Signed token previously created by :func:`generate_token`.

    Returns:
        Optional[User]: Loaded user or ``None`` if token is invalid/expired.

    Side Effects:
        Reads Flask config ``TOKEN_MAX_AGE``.
        Performs a database query.
    """
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
    """Hash a plain-text password.

    Args:
        password: Plain-text password.

    Returns:
        str: Hash suitable for storage.
    """
    return generate_password_hash(password)


def check_password(password_hash: str, password: str) -> bool:
    """Check a plain-text password against a stored hash.

    Args:
        password_hash: Stored hash.
        password: Plain-text password to verify.

    Returns:
        bool: ``True`` if the password matches.
    """
    return check_password_hash(password_hash, password)


def token_required(fn: Callable):
    """Decorator enforcing Bearer-token authentication.

    The wrapped view receives the authenticated :class:`server.models.User`
    instance as the first positional argument.

    Args:
        fn: Flask view function.

    Returns:
        Callable: Wrapped function.

    Side Effects:
        Reads HTTP headers from the current request.

    Examples:
        >>> from server.auth import token_required
        >>> @token_required
        ... def profile(user):
        ...     return {"nickname": user.nickname}
    """
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
    """Create or update a user's profile snapshot.

    Args:
        user: Authenticated user.
        coins: Coin balance. Will be coerced to ``int`` and clamped to ``>= 0``.
        upgrades: JSON string snapshot of upgrades.
        stats: JSON string snapshot of stats.

    Returns:
        Profile: Persisted profile.

    Side Effects:
        Writes to the database (insert/update + commit).
    """
    profile = user.profile or Profile(user=user)
    profile.coins = max(0, int(coins))
    profile.upgrades_snapshot = upgrades
    profile.stats_snapshot = stats
    db.session.add(profile)
    db.session.commit()
    return profile
