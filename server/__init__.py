"""Backend package for the mobile-dev-game repository.

Public API:
	- :func:`server.create_app` (re-exported from :mod:`server.app`)

Most modules under this package are internal implementation details of the
Flask service.
"""

from .app import create_app

__all__ = ["create_app"]
