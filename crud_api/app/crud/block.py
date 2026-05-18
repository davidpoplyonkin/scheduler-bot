from sqlalchemy import select
from sqlalchemy.orm import contains_eager
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import datetime

from models import Block, TimeSlot

async def get_blocks(
        session: AsyncSession,
        start_date_inc: datetime.date,
        end_date_exc: datetime.date,
    ) -> List[Block]:

    stmt = (
        select(Block)
        .join(Block.time_slot)
        .where(
            Block.date >= start_date_inc,
            Block.date < end_date_exc
        )
        .order_by(Block.date, TimeSlot.start_time)
        .options(
            contains_eager(Block.time_slot)
        )
    )

    results = await session.execute(stmt)
    return results.scalars().all()
