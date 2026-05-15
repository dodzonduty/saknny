"""full chapter 3 schema

Revision ID: 20260515_01
Revises:
Create Date: 2026-05-15 16:40:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260515_01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admins",
        sa.Column("admin_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("admin_id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "students",
        sa.Column("student_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("faculty_id", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("gender", sa.String(length=1), nullable=False),
        sa.Column("home_city", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("enroll_status", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("distance_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("preferences", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("student_id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("faculty_id"),
    )

    op.create_table(
        "buildings",
        sa.Column("dorm_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("building_name", sa.String(length=100), nullable=False),
        sa.Column("gender_type", sa.String(length=1), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("gender_type IN ('M', 'F')", name="ck_buildings_gender_type"),
        sa.CheckConstraint(
            "status IN ('active', 'maintenance', 'inactive')",
            name="ck_buildings_status",
        ),
        sa.PrimaryKeyConstraint("dorm_id"),
    )

    op.create_table(
        "verification_documents",
        sa.Column("doc_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("doc_type", sa.String(length=30), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.Column("review_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("flag_reason", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["reviewed_by"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("doc_id"),
    )

    op.create_table(
        "rooms",
        sa.Column("room_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("dorm_id", sa.Integer(), nullable=False),
        sa.Column("room_number", sa.String(length=20), nullable=False),
        sa.Column("total_beds", sa.Integer(), nullable=False),
        sa.Column("available_beds", sa.Integer(), nullable=False),
        sa.Column("dominant_preferences", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("total_beds > 0", name="ck_rooms_total_beds_positive"),
        sa.CheckConstraint(
            "available_beds >= 0 AND available_beds <= total_beds",
            name="ck_rooms_available_beds_range",
        ),
        sa.CheckConstraint("status IN ('active', 'maintenance', 'inactive')", name="ck_rooms_status"),
        sa.ForeignKeyConstraint(["dorm_id"], ["buildings.dorm_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("room_id"),
        sa.UniqueConstraint("dorm_id", "room_number", name="uq_rooms_dorm_room_number"),
    )
    op.create_index("ix_rooms_dorm_id", "rooms", ["dorm_id"])

    op.create_table(
        "applications",
        sa.Column("app_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("preferred_dorm_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="submitted"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("waitlist_position", sa.Integer(), nullable=True),
        sa.Column("submission_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('submitted', 'under_review', 'approved', 'rejected', 'waitlisted')",
            name="ck_applications_status",
        ),
        sa.ForeignKeyConstraint(["preferred_dorm_id"], ["buildings.dorm_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("app_id"),
    )
    op.create_index("ix_applications_student_id", "applications", ["student_id"])
    op.create_index("ix_applications_status", "applications", ["status"])

    op.create_table(
        "application_reviews",
        sa.Column("review_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("app_id", sa.Integer(), nullable=False),
        sa.Column("admin_id", sa.Integer(), nullable=False),
        sa.Column("review_action", sa.String(length=50), nullable=False),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("review_time", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["admin_id"], ["admins.admin_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["app_id"], ["applications.app_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("review_id"),
    )
    op.create_index("ix_application_reviews_app_id", "application_reviews", ["app_id"])
    op.create_index("ix_application_reviews_admin_id", "application_reviews", ["admin_id"])

    op.create_table(
        "allocations",
        sa.Column("allocation_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("admin_id", sa.Integer(), nullable=True),
        sa.Column("app_id", sa.Integer(), nullable=True),
        sa.Column("plan", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="assigned"),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("plan IN ('breakfast', 'full_board')", name="ck_allocations_plan"),
        sa.CheckConstraint("status IN ('assigned', 'cancelled')", name="ck_allocations_status"),
        sa.ForeignKeyConstraint(["admin_id"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["app_id"], ["applications.app_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.room_id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("allocation_id"),
        sa.UniqueConstraint("student_id", name="uq_allocations_student_id"),
    )
    op.create_index("ix_allocations_room_id", "allocations", ["room_id"])

    op.create_table(
        "leases",
        sa.Column("lease_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("allocation_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("admin_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending_signature"),
        sa.Column("document_url", sa.String(length=255), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('pending_signature', 'signed', 'expired')", name="ck_leases_status"
        ),
        sa.ForeignKeyConstraint(["admin_id"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["allocation_id"], ["allocations.allocation_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("lease_id"),
        sa.UniqueConstraint("allocation_id", name="uq_leases_allocation_id"),
    )
    op.create_index("ix_leases_student_id", "leases", ["student_id"])

    op.create_table(
        "payment_intents",
        sa.Column("payment_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("lease_id", sa.Integer(), nullable=True),
        sa.Column("payment_type", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="EGP"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="initiated"),
        sa.Column("gateway_ref", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("payment_type IN ('deposit', 'rent', 'refund')", name="ck_payment_intents_type"),
        sa.CheckConstraint(
            "status IN ('initiated', 'paid', 'failed', 'refunded')",
            name="ck_payment_intents_status",
        ),
        sa.CheckConstraint("amount >= 0", name="ck_payment_intents_amount_non_negative"),
        sa.ForeignKeyConstraint(["lease_id"], ["leases.lease_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("payment_id"),
    )
    op.create_index("ix_payment_intents_student_id", "payment_intents", ["student_id"])
    op.create_index("ix_payment_intents_lease_id", "payment_intents", ["lease_id"])

    op.create_table(
        "checkins",
        sa.Column("checkin_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("allocation_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="initiated"),
        sa.Column("key_issued_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("checked_out_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('initiated', 'checked_in', 'checked_out')", name="ck_checkins_status"
        ),
        sa.ForeignKeyConstraint(["allocation_id"], ["allocations.allocation_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["key_issued_by"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("checkin_id"),
    )
    op.create_index("ix_checkins_student_id", "checkins", ["student_id"])

    op.create_table(
        "maintenance_tickets",
        sa.Column("ticket_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("assigned_admin_id", sa.Integer(), nullable=True),
        sa.Column("escalation_reason", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "priority IN ('low', 'medium', 'high', 'urgent')", name="ck_maintenance_priority"
        ),
        sa.CheckConstraint(
            "status IN ('open', 'assigned', 'in_progress', 'resolved', 'escalated')",
            name="ck_maintenance_status",
        ),
        sa.ForeignKeyConstraint(["assigned_admin_id"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.room_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("ticket_id"),
    )
    op.create_index("ix_maintenance_tickets_student_id", "maintenance_tickets", ["student_id"])
    op.create_index("ix_maintenance_tickets_status", "maintenance_tickets", ["status"])

    op.create_table(
        "room_change_requests",
        sa.Column("request_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("current_room_id", sa.Integer(), nullable=True),
        sa.Column("target_building_id", sa.Integer(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending_review"),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('pending_review', 'approved', 'rejected')",
            name="ck_room_change_requests_status",
        ),
        sa.ForeignKeyConstraint(["current_room_id"], ["rooms.room_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_building_id"], ["buildings.dorm_id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("request_id"),
    )
    op.create_index("ix_room_change_requests_student_id", "room_change_requests", ["student_id"])
    op.create_index("ix_room_change_requests_status", "room_change_requests", ["status"])

    op.create_table(
        "announcements",
        sa.Column("announcement_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("target_role", sa.String(length=20), nullable=False, server_default="student"),
        sa.Column("published_by", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "target_role IN ('student', 'admin', 'all')", name="ck_announcements_target_role"
        ),
        sa.ForeignKeyConstraint(["published_by"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("announcement_id"),
    )
    op.create_index("ix_announcements_is_active", "announcements", ["is_active"])

    op.create_table(
        "messages",
        sa.Column("message_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("sender_role", sa.String(length=20), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("recipient_role", sa.String(length=20), nullable=False),
        sa.Column("recipient_id", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("sender_role IN ('student', 'admin')", name="ck_messages_sender_role"),
        sa.CheckConstraint(
            "recipient_role IN ('student', 'admin')", name="ck_messages_recipient_role"
        ),
        sa.PrimaryKeyConstraint("message_id"),
    )
    op.create_index("ix_messages_sender", "messages", ["sender_role", "sender_id"])
    op.create_index("ix_messages_recipient", "messages", ["recipient_role", "recipient_id"])

    op.create_table(
        "audit_logs",
        sa.Column("audit_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("actor_role", sa.String(length=20), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("before_state", sa.JSON(), nullable=True),
        sa.Column("after_state", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "actor_role IN ('student', 'admin', 'system')", name="ck_audit_logs_actor_role"
        ),
        sa.PrimaryKeyConstraint("audit_id"),
    )
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_entity", "audit_logs", ["entity_type", "entity_id"])

    op.create_table(
        "surveys",
        sa.Column("survey_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["admins.admin_id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("survey_id"),
    )

    op.create_table(
        "survey_dispatches",
        sa.Column("dispatch_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("survey_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="sent"),
        sa.Column("response_payload", sa.JSON(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('sent', 'completed')", name="ck_survey_dispatch_status"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["survey_id"], ["surveys.survey_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("dispatch_id"),
    )
    op.create_index("ix_survey_dispatch_student_id", "survey_dispatches", ["student_id"])
    op.create_index("ix_survey_dispatch_survey_id", "survey_dispatches", ["survey_id"])


def downgrade() -> None:
    op.drop_index("ix_survey_dispatch_survey_id", table_name="survey_dispatches")
    op.drop_index("ix_survey_dispatch_student_id", table_name="survey_dispatches")
    op.drop_table("survey_dispatches")
    op.drop_table("surveys")
    op.drop_index("ix_audit_logs_entity", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_messages_recipient", table_name="messages")
    op.drop_index("ix_messages_sender", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_announcements_is_active", table_name="announcements")
    op.drop_table("announcements")
    op.drop_index("ix_room_change_requests_status", table_name="room_change_requests")
    op.drop_index("ix_room_change_requests_student_id", table_name="room_change_requests")
    op.drop_table("room_change_requests")
    op.drop_index("ix_maintenance_tickets_status", table_name="maintenance_tickets")
    op.drop_index("ix_maintenance_tickets_student_id", table_name="maintenance_tickets")
    op.drop_table("maintenance_tickets")
    op.drop_index("ix_checkins_student_id", table_name="checkins")
    op.drop_table("checkins")
    op.drop_index("ix_payment_intents_lease_id", table_name="payment_intents")
    op.drop_index("ix_payment_intents_student_id", table_name="payment_intents")
    op.drop_table("payment_intents")
    op.drop_index("ix_leases_student_id", table_name="leases")
    op.drop_table("leases")
    op.drop_index("ix_allocations_room_id", table_name="allocations")
    op.drop_table("allocations")
    op.drop_index("ix_application_reviews_admin_id", table_name="application_reviews")
    op.drop_index("ix_application_reviews_app_id", table_name="application_reviews")
    op.drop_table("application_reviews")
    op.drop_index("ix_applications_status", table_name="applications")
    op.drop_index("ix_applications_student_id", table_name="applications")
    op.drop_table("applications")
    op.drop_index("ix_rooms_dorm_id", table_name="rooms")
    op.drop_table("rooms")
    op.drop_table("verification_documents")
    op.drop_table("buildings")
    op.drop_table("students")
    op.drop_table("admins")
