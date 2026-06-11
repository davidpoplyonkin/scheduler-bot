from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from models import Service


async def get_services(session: AsyncSession) -> List[Service]:
    """
    Get all services with their translations.
    Translations are eager-loaded via the selectin relationship.
    """
    statement = select(Service).order_by(Service.id)
    results = await session.execute(statement)
    return list(results.scalars().all())
