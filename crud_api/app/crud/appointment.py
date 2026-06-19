from sqlalchemy import select
from sqlalchemy.orm import contains_eager, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from fastapi import status

from exceptions import AppException
from typing import List
import datetime

from models import Appointment, Block, TimeSlot, User, Service
from utils import get_today_in_tz

async def get_user_appointments(
        session: AsyncSession,
        user_id: int,
    ) -> List[Appointment]:

    today_date = get_today_in_tz().date()

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
            .contains_eager(Block.time_slot),
            joinedload(Appointment.service)
        )
    )

    results = await session.execute(statement)

    return results.scalars().all()

async def reserve_appointment(
    session: AsyncSession,
    user_id: int,
    date: datetime.date,
    time_slot_id: int,
    service_id: int,
) -> Appointment:
    try:
        # Attempt to insert a new Block
        block_stmt = (
            insert(Block)
            .values(date=date, time_slot_id=time_slot_id)
            .on_conflict_do_nothing(index_elements=["date", "time_slot_id"])
            .returning(Block.id)
        )
        
        block_result = await session.execute(block_stmt)
        block = block_result.scalar_one_or_none()

        if block is None:  # block already exists
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Time slot is already reserved for the selected date.",
                non_critical=True,
                non_sensitive=True,
            )
        
        # Insert the Appointment
        appt_stmt = (
            insert(Appointment)
            .values(user_id=user_id, block_id=block, service_id=service_id)
            .returning(Appointment)
        )

        appt_result = await session.execute(appt_stmt)
        appointment = appt_result.scalar_one()

        # Return eagerly loaded appointment with block and time slot details
        eager_stmt = (
            select(Appointment)
            .options(
                joinedload(Appointment.block)
                .joinedload(Block.time_slot),
                joinedload(Appointment.service)
            )
            .where(Appointment.id == appointment.id)
        )
        
        eager_result = await session.execute(eager_stmt)

        await session.commit()
        return eager_result.unique().scalar_one()
    except IntegrityError:
        await session.rollback()
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid time slot or service provided.",
            non_critical=False,
        )


async def get_admin_appointments(
    session: AsyncSession,
) -> List[Appointment]:
    today_date = get_today_in_tz().date()

    statement = (
        select(Appointment)
        .join(Appointment.block)
        .join(Block.time_slot)
        .join(Appointment.user)
        .where(Block.date >= today_date)
        .order_by(Block.date, TimeSlot.start_time)
        .options(
            contains_eager(Appointment.block)
            .contains_eager(Block.time_slot),
            contains_eager(Appointment.user),
            joinedload(Appointment.service)
        )
    )

    results = await session.execute(statement)
    return results.unique().scalars().all()


async def get_appointment_with_user(
    session: AsyncSession,
    appointment_id: int,
) -> Appointment | None:
    statement = (
        select(Appointment)
        .options(
            joinedload(Appointment.block).joinedload(Block.time_slot),
            joinedload(Appointment.user),
            joinedload(Appointment.service)
        )
        .where(Appointment.id == appointment_id)
    )
    result = await session.execute(statement)
    return result.unique().scalar_one_or_none()
