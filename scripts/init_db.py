"""
Saknny – Database Initialization Script (Role A: Data Layer)

Creates all tables defined in the models package.
Run this script after the PostgreSQL container is up.

Usage:
    python -m scripts.init_db
"""

import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import engine
from backend.app.models import Base  # noqa: F401 – triggers model registration


def init_database():
    """Create all tables that don't already exist."""
    print("=" * 60)
    print("  Saknny – Database Initialization")
    print("=" * 60)
    print(f"\n  Engine URL : {engine.url}")
    print("  Creating tables ...\n")

    Base.metadata.create_all(bind=engine)

    # List created tables
    table_names = list(Base.metadata.tables.keys())
    for name in table_names:
        print(f"  [OK]  {name}")

    print(f"\n  Done – {len(table_names)} table(s) ready.")
    print("=" * 60)


if __name__ == "__main__":
    init_database()
