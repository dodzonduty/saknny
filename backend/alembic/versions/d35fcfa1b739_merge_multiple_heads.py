"""merge multiple heads

Revision ID: d35fcfa1b739
Revises: 47db55240115, efd624cc5201
Create Date: 2026-06-16 10:34:16.600751
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd35fcfa1b739'
down_revision: Union[str, None] = ('47db55240115', 'efd624cc5201')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
