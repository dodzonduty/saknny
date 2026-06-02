"""move geofence fields from buildings to rooms

Revision ID: 20260601_01
Revises: 20260526_01
Create Date: 2026-06-01 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260601_01"
down_revision: Union[str, None] = "20260526_01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("rooms", sa.Column("latitude", sa.Numeric(9, 6), nullable=True))
    op.add_column("rooms", sa.Column("longitude", sa.Numeric(9, 6), nullable=True))
    op.add_column(
        "rooms",
        sa.Column(
            "allowed_radius_meters",
            sa.Integer(),
            nullable=False,
            server_default="100",
        ),
    )
    op.create_check_constraint(
        "ck_rooms_allowed_radius_positive",
        "rooms",
        "allowed_radius_meters > 0",
    )

    # Copy existing building geofence values onto each room in that building.
    op.execute(
        """
        UPDATE rooms AS r
        SET
            latitude = b.latitude,
            longitude = b.longitude,
            allowed_radius_meters = b.allowed_radius_meters
        FROM buildings AS b
        WHERE r.dorm_id = b.dorm_id
          AND b.latitude IS NOT NULL
          AND b.longitude IS NOT NULL
        """
    )

    op.drop_constraint("ck_buildings_allowed_radius_positive", "buildings", type_="check")
    op.drop_column("buildings", "allowed_radius_meters")
    op.drop_column("buildings", "longitude")
    op.drop_column("buildings", "latitude")


def downgrade() -> None:
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

    op.execute(
        """
        UPDATE buildings AS b
        SET
            latitude = r.latitude,
            longitude = r.longitude,
            allowed_radius_meters = r.allowed_radius_meters
        FROM (
            SELECT DISTINCT ON (dorm_id)
                dorm_id,
                latitude,
                longitude,
                allowed_radius_meters
            FROM rooms
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            ORDER BY dorm_id, room_id
        ) AS r
        WHERE b.dorm_id = r.dorm_id
        """
    )

    op.drop_constraint("ck_rooms_allowed_radius_positive", "rooms", type_="check")
    op.drop_column("rooms", "allowed_radius_meters")
    op.drop_column("rooms", "longitude")
    op.drop_column("rooms", "latitude")
