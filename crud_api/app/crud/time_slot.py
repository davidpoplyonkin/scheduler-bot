from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from models import TimeSlot

async def get_time_slots(session: AsyncSession) -> List[TimeSlot]:

    statement = select(TimeSlot).order_by(TimeSlot.start_time)
    results = await session.execute(statement)

    return results.scalars().all()
