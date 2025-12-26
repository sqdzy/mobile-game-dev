"""Database integration for the Flask backend.

This module exposes a shared SQLAlchemy instance (:data:`db`) and an
initialization helper (:func:`init_db`).

Side Effects:
    :func:`init_db` creates all tables defined by the ORM models.
"""

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def init_db(app):
    """Initialize SQLAlchemy and create tables.

    Args:
        app: Flask application instance.

    Side Effects:
        - Binds SQLAlchemy to the Flask app.
        - Creates all ORM tables (``db.create_all()``) inside the app context.
    """
    db.init_app(app)
    with app.app_context():
        db.create_all()
