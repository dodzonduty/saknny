"""
Saknny – Models Package (Role A: Data Layer)

Central import point for all SQLAlchemy ORM models.
Import `Base` from here to create / drop tables.
"""

from backend.app.core.database import Base  # noqa: F401

# ── Models ────────────────────────────────────────────────────────────
from backend.app.models.admin import Admin  # noqa: F401
from backend.app.models.student import Student  # noqa: F401
from backend.app.models.verification_document import VerificationDocument  # noqa: F401
