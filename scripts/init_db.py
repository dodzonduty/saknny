"""
Saknny – Database Initialization Script (Role A: Data Layer)

Applies Alembic migrations to bring schema to the latest revision.
Run this script after the PostgreSQL container is up.

Usage:
    python -m scripts.init_db
"""

import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# pylint: disable=import-error
from alembic import command
from alembic.config import Config


def init_database():
    """Run Alembic upgrade head."""
    print("=" * 60)
    print("  Saknny – Database Migration")
    print("=" * 60)
    print("\n  Applying migrations ...\n")

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    alembic_ini = os.path.join(repo_root, "backend", "alembic.ini")
    alembic_scripts = os.path.join(repo_root, "backend", "alembic")
    cfg = Config(alembic_ini)
    cfg.set_main_option("script_location", alembic_scripts)
    command.upgrade(cfg, "head")

    print("  [OK]  Alembic upgrade head completed")
    print("=" * 60)


if __name__ == "__main__":
    init_database()
