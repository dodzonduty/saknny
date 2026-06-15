"""add compatibility tables

Revision ID: a1b2c3d4e5f6
Revises: e6ad8b5c7df8
Create Date: 2026-06-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e6ad8b5c7df8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # compatibility_questionnaires
    op.create_table('compatibility_questionnaires',
    sa.Column('questionnaire_id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('title', sa.String(length=160), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('target_gender', sa.String(length=1), nullable=True),
    sa.Column('target_dorm_id', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['admins.admin_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['target_dorm_id'], ['buildings.dorm_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('questionnaire_id')
    )

    # compatibility_responses
    op.create_table('compatibility_responses',
    sa.Column('response_id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('questionnaire_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('answers', sa.JSON(), nullable=False),
    sa.Column('feature_vector', sa.JSON(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False, server_default='submitted'),
    sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['questionnaire_id'], ['compatibility_questionnaires.questionnaire_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['students.student_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('response_id')
    )
    op.create_index('ix_compat_resp_quest_student', 'compatibility_responses', ['questionnaire_id', 'student_id'], unique=True)
    op.create_index('ix_compat_resp_quest_status', 'compatibility_responses', ['questionnaire_id', 'status'], unique=False)

    # clustering_sessions
    op.create_table('clustering_sessions',
    sa.Column('session_id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('questionnaire_id', sa.Integer(), nullable=False),
    sa.Column('dorm_id', sa.Integer(), nullable=True),
    sa.Column('algorithm', sa.String(length=30), nullable=False, server_default='kmeans'),
    sa.Column('k_value', sa.Integer(), nullable=False),
    sa.Column('total_students', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False, server_default='completed'),
    sa.Column('parameters', sa.JSON(), nullable=True),
    sa.Column('run_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['dorm_id'], ['buildings.dorm_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['questionnaire_id'], ['compatibility_questionnaires.questionnaire_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['run_by'], ['admins.admin_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('session_id')
    )

    # clustering_results
    op.create_table('clustering_results',
    sa.Column('result_id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('cluster_label', sa.Integer(), nullable=False),
    sa.Column('distance_to_centroid', sa.Numeric(precision=8, scale=4), nullable=True),
    sa.Column('assigned_room_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['assigned_room_id'], ['rooms.room_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['session_id'], ['clustering_sessions.session_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['students.student_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('result_id')
    )
    op.create_index('ix_cluster_res_sess_label', 'clustering_results', ['session_id', 'cluster_label'], unique=False)
    op.create_index('ix_cluster_res_sess_student', 'clustering_results', ['session_id', 'student_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_cluster_res_sess_student', table_name='clustering_results')
    op.drop_index('ix_cluster_res_sess_label', table_name='clustering_results')
    op.drop_table('clustering_results')
    op.drop_table('clustering_sessions')
    op.drop_index('ix_compat_resp_quest_status', table_name='compatibility_responses')
    op.drop_index('ix_compat_resp_quest_student', table_name='compatibility_responses')
    op.drop_table('compatibility_responses')
    op.drop_table('compatibility_questionnaires')
