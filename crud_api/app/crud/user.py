from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from models import User

async def get_user(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def upsert_user(
    session: AsyncSession,
    tg_id: int,
    full_name: str | None = None,
    language_code: str | None = None
) -> User:
    stmt = insert(User).values(tg_id=tg_id, full_name=full_name, language_code=language_code)

    statement = (
        stmt.on_conflict_do_update(
            index_elements=["tg_id"], # columns with the unique constraint
            set_={ # columns to update
                "full_name": stmt.excluded.full_name,
                "language_code": stmt.excluded.language_code,
            }
        )
        .returning(User) # return the updated user
        .execution_options(populate_existing=True)
    )

    result = await session.execute(statement)
    user = result.scalar_one()

    await session.commit()
    return user


async def get_user_by_tg_id(session: AsyncSession, tg_id: int) -> User | None:
    result = await session.execute(select(User).where(User.tg_id == tg_id))
    return result.scalar_one_or_none()
