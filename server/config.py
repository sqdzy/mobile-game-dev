import os
from pathlib import Path


class Config:
    BASE_DIR = Path(__file__).resolve().parent
    SECRET_KEY = os.environ.get("API_SECRET_KEY", "change-me-in-prod")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'leaderboard.db'}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TOKEN_MAX_AGE = int(os.environ.get("TOKEN_MAX_AGE", 60 * 60 * 24 * 7))  # 7 days
    JSON_SORT_KEYS = False
