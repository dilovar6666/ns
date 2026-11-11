"""Add idempotency key to check-ins.

Revision ID: 9ca4f625d301
Revises: 640d421a5f24
"""

from alembic import op
import sqlalchemy as sa


revision = "9ca4f625d301"
down_revision = "640d421a5f24"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("mental_checkins") as batch:
        batch.add_column(sa.Column("client_operation_id", sa.String(length=80), nullable=True))
        batch.create_unique_constraint("uq_mental_checkins_client_operation_id", ["client_operation_id"])


def downgrade():
    with op.batch_alter_table("mental_checkins") as batch:
        batch.drop_constraint("uq_mental_checkins_client_operation_id", type_="unique")
        batch.drop_column("client_operation_id")
