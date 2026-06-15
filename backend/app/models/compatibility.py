"""
Saknny – Compatibility Models (Role A: Data Layer)

Schema source: roommate_matching_questionnaire_v3.pdf & schema.md Chapter 13.
Represents tables for questionnaire metadata, student responses, and KMeans clustering sessions.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    CheckConstraint,
    Index,
    JSON,
    Numeric,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class CompatibilityQuestionnaire(Base):
    __tablename__ = "compatibility_questionnaires"
    __table_args__ = (
        CheckConstraint("target_gender IN ('M', 'F')", name="ck_compat_quest_gender"),
    )

    questionnaire_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_gender: Mapped[str | None] = mapped_column(String(1), nullable=True)
    target_dorm_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("buildings.dorm_id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class CompatibilityResponse(Base):
    __tablename__ = "compatibility_responses"
    __table_args__ = (
        CheckConstraint(
            "status IN ('submitted', 'vectorized', 'clustered')",
            name="ck_compat_resp_status",
        ),
        Index("ix_compat_resp_quest_student", "questionnaire_id", "student_id", unique=True),
        Index("ix_compat_resp_quest_status", "questionnaire_id", "status"),
    )

    response_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    questionnaire_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("compatibility_questionnaires.questionnaire_id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False
    )
    answers: Mapped[dict] = mapped_column(JSON, nullable=False)
    feature_vector: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="submitted")
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ClusteringSession(Base):
    __tablename__ = "clustering_sessions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('completed', 'assigned', 'discarded')",
            name="ck_cluster_session_status",
        ),
    )

    session_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    questionnaire_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("compatibility_questionnaires.questionnaire_id", ondelete="CASCADE"), nullable=False
    )
    dorm_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("buildings.dorm_id", ondelete="SET NULL"), nullable=True
    )
    algorithm: Mapped[str] = mapped_column(String(30), nullable=False, default="kmeans")
    k_value: Mapped[int] = mapped_column(Integer, nullable=False)
    total_students: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="completed")
    parameters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    run_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class ClusteringResult(Base):
    __tablename__ = "clustering_results"
    __table_args__ = (
        Index("ix_cluster_res_sess_student", "session_id", "student_id", unique=True),
        Index("ix_cluster_res_sess_label", "session_id", "cluster_label"),
    )

    result_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clustering_sessions.session_id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False
    )
    cluster_label: Mapped[int] = mapped_column(Integer, nullable=False)
    distance_to_centroid: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    assigned_room_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("rooms.room_id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
