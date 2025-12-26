"""Flask entrypoint for the backend API.

This module wires together the backend components:

- Loads configuration from :class:`server.config.Config`.
- Initializes the database via :func:`server.database.init_db`.
- Registers the REST API blueprint from :mod:`server.routes` under the ``/api`` prefix.

The module exposes :func:`create_app` for WSGI servers and a module-level
``app`` instance for Flask CLI usage.

Examples:
    Run the API in development (from the repository root):

    >>> # PowerShell
    >>> # python -m venv .venv
    >>> # .\.venv\Scripts\Activate.ps1
    >>> # pip install -r server/requirements.txt
    >>> # flask --app server.app run --port 5000

    Run the API when your working directory is ``server/``:

    >>> # flask --app app run --port 5000
"""

from __future__ import annotations

import os
import sys

from flask import Flask
from flask_cors import CORS

if __package__ in (None, ""):
    package_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(package_dir)
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

from server.config import Config
from server.database import init_db
from server.routes import api_bp


def create_app() -> Flask:
    """Create and configure the Flask application.

    Returns:
        Flask: Configured Flask application.

    Side Effects:
        - Initializes the SQLAlchemy extension and creates DB tables (see
          :func:`server.database.init_db`).
        - Enables CORS for routes under ``/api/*``.
        - Registers the API blueprint.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    init_db(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(api_bp, url_prefix="/api")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
