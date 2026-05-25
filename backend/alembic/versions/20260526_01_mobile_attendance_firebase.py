"""mobile attendance firebase schema

Revision ID: 20260526_01
Revises: 20260515_01
Create Date: 2026-05-26 00:55:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260526_01"
down_revision: Union[str, None] = "20260515_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("firebase_uid", sa.String(length=128), nullable=True))
    op.add_column("students", sa.Column("fcm_token", sa.String(length=512), nullable=True))
    op.create_unique_constraint("uq_students_firebase_uid", "students", ["firebase_uid"])

    op.add_column("buildings", sa.Column("latitude", sa.Numeric(9, 6), nullable=True))
    op.add_column("buildings", sa.Column("longitude", sa.Numeric(9, 6), nullable=True))
    op.add_column(
        "buildings",
        sa.Column(
            "allowed_radius_meters",
            sa.Integer(),
            nullable=False,
            server_default="100",
        ),
    )
    op.create_check_constraint(
        "ck_buildings_allowed_radius_positive",
        "buildings",
        "allowed_radius_meters > 0",
    )

    op.create_table(
        "attendance_records",
        sa.Column("attendance_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("allocation_id", sa.Integer(), nullable=True),
        sa.Column("dorm_id", sa.Integer(), nullable=True),
        sa.Column("attendance_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attendance_date", sa.Date(), nullable=False),
        sa.Column("client_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("distance_meters", sa.Numeric(10, 2), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("rejection_reason", sa.String(length=200), nullable=True),
        sa.Column("device_id", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('SUCCESS', 'REJECTED')",
            name="ck_attendance_records_status",
        ),
        sa.ForeignKeyConstraint(["allocation_id"], ["allocations.allocation_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["dorm_id"], ["buildings.dorm_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("attendance_id"),
    )
    op.create_index("ix_attendance_records_student_id", "attendance_records", ["student_id"])
    op.create_index(
        "ix_attendance_records_attendance_date",
        "attendance_records",
        ["attendance_date"],
    )
    op.create_index("ix_attendance_records_status", "attendance_records", ["status"])
    op.create_index(
        "ix_attendance_records_rejection_reason",
        "attendance_records",
        ["rejection_reason"],
    )
    op.create_index(
        "uq_attendance_daily_success",
        "attendance_records",
        ["student_id", "attendance_date"],
        unique=True,
        postgresql_where=sa.text("status = 'SUCCESS'"),
    )


def downgrade() -> None:
    op.drop_index("uq_attendance_daily_success", table_name="attendance_records")
    op.drop_index("ix_attendance_records_rejection_reason", table_name="attendance_records")
    op.drop_index("ix_attendance_records_status", table_name="attendance_records")
    op.drop_index("ix_attendance_records_attendance_date", table_name="attendance_records")
    op.drop_index("ix_attendance_records_student_id", table_name="attendance_records")
    op.drop_table("attendance_records")

    op.drop_constraint("ck_buildings_allowed_radius_positive", "buildings", type_="check")
    op.drop_column("buildings", "allowed_radius_meters")
    op.drop_column("buildings", "longitude")
    op.drop_column("buildings", "latitude")

    op.drop_constraint("uq_students_firebase_uid", "students", type_="unique")
    op.drop_column("students", "fcm_token")
    op.drop_column("students", "firebase_uid")
