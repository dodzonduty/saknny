"""
Saknny – Student Model (Role A: Data Layer)

Represents students who use the platform to search for and apply to university housing.
Students register, verify enrollment, browse dorms, and submit housing applications.

Schema source: First Term Report V1.0, Section 3.5.4 – Data Dictionary (Table: Students)
Enhanced with: email, password_hash (auth), and created_at/updated_at (audit logging).
"""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, Boolean, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    # ── Primary Key ───────────────────────────────────────────────────
    student_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ── University Identity ───────────────────────────────────────────
    # Official faculty ID number (e.g., "231903608")
    faculty_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    # ── Personal Info ─────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    gender: Mapped[str] = mapped_column(String(1), nullable=False)  # 'M' or 'F'
    home_city: Mapped[str] = mapped_column(String(50), nullable=False)

    # ── Authentication ────────────────────────────────────────────────
    # bcrypt produces ~60-char hashes; VARCHAR(255) gives headroom.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Verification & Eligibility ────────────────────────────────────
    # Set to TRUE by Admin after enrollment verification
    enroll_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Priority score calculated from student's home city distance
    distance_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0, nullable=False)

    # ── Preferences (for AI matching agent) ───────────────────────────
    preferences: Mapped[str | None] = mapped_column(String(200), nullable=True)

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
        return (
            f"<Student(student_id={self.student_id}, faculty_id='{self.faculty_id}', "
            f"name='{self.name}', enroll_status={self.enroll_status})>"
        )
