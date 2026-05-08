from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from models import User

async def upsert_user(
    session: AsyncSession,
    tg_id: int,
    full_name: str | None = None
) -> User:
    stmt = insert(User).values(tg_id=tg_id, full_name=full_name)

    statement = (
        stmt.on_conflict_do_update(
            index_elements=["tg_id"], # columns with the unique constraint
            set_={ # columns to update
                "full_name": stmt.excluded.full_name,
            }
        )
        .returning(User) # return the updated user
        .execution_options(populate_existing=True)
    )

    result = await session.execute(statement)
    user = result.scalar_one()

    await session.commit()
    return user
