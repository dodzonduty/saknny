"""
Saknny – Admin Model (Role A: Data Layer)

Represents university staff members who manage the housing platform.
Admins can review applications, manage inventory, assign beds, and issue leases.

Schema source: First Term Report V1.0, Section 3.5.4 – Data Dictionary (Table: Admin)
"""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Admin(Base):
    __tablename__ = "admins"

    # ── Primary Key ───────────────────────────────────────────────────
    admin_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ── Identity ──────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # ── Authentication ────────────────────────────────────────────────
    # bcrypt produces ~60-char hashes; VARCHAR(255) gives headroom.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Role / Permissions ────────────────────────────────────────────
    # Examples: "Housing Manager", "Staff", "Super Admin"
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    # ── Audit Timestamps ──────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Admin(admin_id={self.admin_id}, email='{self.email}', role='{self.role}')>"
