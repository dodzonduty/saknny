"""
Saknny Database Configuration

Centralized database connection settings.
All models and scripts import the engine, session, and Base from here.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# ── Connection Settings ───────────────────────────────────────────────
DATABASE_URL = "postgresql://saknny_admin:saknny_secret_2026@localhost:5433/saknny"

engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def get_db():
    """FastAPI dependency – yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
