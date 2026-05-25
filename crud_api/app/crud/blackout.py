from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
import datetime
from datetime import timedelta

from models import Block, Blackout, TimeSlot

async def create_blackouts(
    session: AsyncSession,
    start_date: datetime.date,
    end_date: datetime.date,
    slots: list[int],
) -> int:
    # If no specific slots, get all time slot IDs
    if not slots:
        result = await session.execute(select(TimeSlot.id))
        slots = list(result.scalars().all())

    # Generate all date/slot combinations
    block_values = []
    current_date = start_date
    while current_date <= end_date:
        for time_slot_id in slots:
            block_values.append({
                "date": current_date,
                "time_slot_id": time_slot_id
            })
        current_date += timedelta(days=1)

    if not block_values:
        return 0

    # Bulk insert blocks with on_conflict_do_nothing
    block_stmt = (
        insert(Block)
        .values(block_values)
        .on_conflict_do_nothing(index_elements=["date", "time_slot_id"])
        .returning(Block.id)
    )
    result = await session.execute(block_stmt)
    created_block_ids = list(result.scalars().all())

    # Insert blackouts for newly created blocks
    if created_block_ids:
        blackout_stmt = (
            insert(Blackout)
            .values([{"block_id": bid} for bid in created_block_ids])
            .on_conflict_do_nothing(index_elements=["block_id"])
        )
        await session.execute(blackout_stmt)

    await session.commit()
    return len(created_block_ids)
