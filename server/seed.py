"""Utility script to populate the database with a demo user.

This script prompts for a nickname/password and inserts a new user.

Examples:
    Run from repository root:

    >>> # python -m server.seed
"""

from getpass import getpass

from .app import create_app
from .auth import hash_password
from .database import db
from .models import User


def main():
    """Create a single user from interactive input.

    Side Effects:
        - Prompts on stdin.
        - Writes to the database.
        - Prints a confirmation message.
    """
    app = create_app()
    with app.app_context():
        nickname = input("Nickname: ").strip()
        password = getpass("Password: ")
        user = User(nickname=nickname, password_hash=hash_password(password))
        db.session.add(user)
        db.session.commit()
        print(f"Created user {nickname}")


if __name__ == "__main__":
    main()
