"""Application configuration.

The backend reads configuration primarily from environment variables.
Defaults are suitable only for local development.

Environment Variables:
    API_SECRET_KEY:
        Secret key used to sign authentication tokens.
        Default: ``"change-me-in-prod"``.

    DATABASE_URL:
        SQLAlchemy database URL.
        Default: SQLite file ``server/leaderboard.db``.

    TOKEN_MAX_AGE:
        Token validity in seconds.
        Default: 7 days.
"""

import os
from pathlib import Path


class Config:
    """Flask configuration object.

    Attributes:
        BASE_DIR: Directory containing this module.
        SECRET_KEY: Used by the token serializer.
        SQLALCHEMY_DATABASE_URI: Database URL for SQLAlchemy.
        SQLALCHEMY_TRACK_MODIFICATIONS: Disabled to reduce overhead.
        TOKEN_MAX_AGE: Token max age (seconds).
        JSON_SORT_KEYS: Disabled to preserve response key order.
    """
    BASE_DIR = Path(__file__).resolve().parent
    SECRET_KEY = os.environ.get("API_SECRET_KEY", "change-me-in-prod")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'leaderboard.db'}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TOKEN_MAX_AGE = int(os.environ.get("TOKEN_MAX_AGE", 60 * 60 * 24 * 7))  # 7 days
    JSON_SORT_KEYS = False
