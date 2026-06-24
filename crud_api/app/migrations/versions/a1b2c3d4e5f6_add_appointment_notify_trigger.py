"""add appointment notify trigger

Revision ID: a1b2c3d4e5f6
Revises: c17e6ba18ec2
Create Date: 2026-06-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c17e6ba18ec2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Create function that emits NOTIFY with appointment id, status, and user_id
    conn.execute(sa.text("""
        CREATE OR REPLACE FUNCTION notify_appointment_change()
        RETURNS TRIGGER AS $$
        BEGIN
            PERFORM pg_notify(
                'appointment_updates',
                jsonb_build_object(
                    'id', NEW.id,
                    'status', NEW.status,
                    'user_id', NEW.user_id
                )::text
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))

    # Create trigger on appointments table for INSERT and UPDATE
    conn.execute(sa.text("""
        CREATE TRIGGER appointment_notify_trigger
        AFTER INSERT OR UPDATE ON appointments
        FOR EACH ROW
        EXECUTE FUNCTION notify_appointment_change();
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DROP TRIGGER IF EXISTS appointment_notify_trigger ON appointments;"))
    conn.execute(sa.text("DROP FUNCTION IF EXISTS notify_appointment_change;"))
