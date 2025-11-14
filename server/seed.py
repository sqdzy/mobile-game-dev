"""Utility script to populate the SQLite database with demo users."""

from getpass import getpass

from .app import create_app
from .auth import hash_password
from .database import db
from .models import User


def main():
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
