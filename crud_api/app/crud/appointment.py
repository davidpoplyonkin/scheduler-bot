from sqlalchemy import select
from sqlalchemy.orm import contains_eager
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from models import Appointment, Block, TimeSlot
from utils import get_today_in_tz

async def get_user_appointments(
        session: AsyncSession,
        user_id: int,
    ) -> List[Appointment]:

    today_date = get_today_in_tz()

    statement = (
        select(Appointment)
        .join(Appointment.block)
        .join(Block.time_slot)
        .where(
            Appointment.user_id == user_id,
            Block.date >= today_date
        )
        .order_by(Block.date, TimeSlot.start_time)
        .options(
            contains_eager(Appointment.block)
            .contains_eager(Block.time_slot)
        )
    )

    results = await session.execute(statement)

    return results.scalars().all()
