from sqlalchemy import select
from sqlalchemy.orm import contains_eager
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from models import Appointment, TimeSlot
from utils import get_today_in_tz

async def get_user_appointments(
        session: AsyncSession,
        user_id: int,
    ) -> List[Appointment]:

    today_date = get_today_in_tz()

    statement = (
        select(Appointment)
        .join(Appointment.time_slot)
        .where(
            Appointment.user_id == user_id,
            Appointment.date >= today_date
        )
        .order_by(Appointment.date, TimeSlot.start_time)
        .options(contains_eager(Appointment.time_slot))
    )

    results = await session.execute(statement)

    return results.scalars().all()
