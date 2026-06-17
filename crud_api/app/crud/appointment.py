from sqlalchemy import select, delete, update
from sqlalchemy.orm import contains_eager, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List
import datetime

from models import Appointment, Block, TimeSlot, User, Service
from models.appointment import AppointmentStatus
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
        block_id = block_result.scalar_one_or_none()

        if block_id is None:  # block already exists
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Time slot is already reserved for the selected date."
            )

        # Insert the Appointment with status=PENDING, invoice_id=NULL
        appt_stmt = (
            insert(Appointment)
            .values(
                user_id=user_id,
                block_id=block_id,
                service_id=service_id,
                status=AppointmentStatus.PENDING,
            )
            .returning(Appointment.id)
        )

        appt_result = await session.execute(appt_stmt)
        appointment_id = appt_result.scalar_one()

        # Fetch appointment eagerly with block, time_slot, and service
        eager_stmt = (
            select(Appointment)
            .options(
                joinedload(Appointment.block)
                .joinedload(Block.time_slot),
                joinedload(Appointment.service)
            )
            .where(Appointment.id == appointment_id)
        )

        eager_result = await session.execute(eager_stmt)
        appointment = eager_result.unique().scalar_one()

        await session.commit()
        return appointment
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid time slot or service provided."
        )


async def confirm_appointment_invoice(
    session: AsyncSession,
    appointment_id: int,
    invoice_id: str,
) -> Appointment:
    """Update appointment with invoice_id after successful payment creation."""
    stmt = (
        update(Appointment)
        .where(Appointment.id == appointment_id)
        .values(invoice_id=invoice_id)
    )
    await session.execute(stmt)
    await session.commit()

    # Re-fetch with eager loading
    eager_stmt = (
        select(Appointment)
        .options(
            joinedload(Appointment.block).joinedload(Block.time_slot),
            joinedload(Appointment.service).joinedload(Service.translations),
        )
        .where(Appointment.id == appointment_id)
    )
    result = await session.execute(eager_stmt)
    return result.unique().scalar_one()


async def cancel_appointment_invoice(
    session: AsyncSession,
    appointment_id: int,
) -> None:
    """Cancel appointment and delete block after failed payment creation."""
    # Update appointment status to CANCELLED and get block_id
    stmt = (
        update(Appointment)
        .where(Appointment.id == appointment_id)
        .values(status=AppointmentStatus.CANCELLED)
        .returning(Appointment.block_id)
    )
    result = await session.execute(stmt)
    block_id = result.scalar_one_or_none()

    # Delete block (appointment.block_id becomes NULL via ON DELETE SET NULL)
    if block_id is not None:
        await session.execute(delete(Block).where(Block.id == block_id))

    await session.commit()


async def confirm_appointment_payment(
    session: AsyncSession,
    appointment_id: int,
) -> Appointment | None:
    """Mark appointment as CONFIRMED after successful payment."""
    stmt = (
        update(Appointment)
        .where(Appointment.id == appointment_id)
        .values(status=AppointmentStatus.CONFIRMED)
    )
    await session.execute(stmt)
    await session.commit()

    # Re-fetch with eager loading including service translations
    eager_stmt = (
        select(Appointment)
        .options(
            joinedload(Appointment.block).joinedload(Block.time_slot),
            joinedload(Appointment.user),
            joinedload(Appointment.service).joinedload(Service.translations),
        )
        .where(Appointment.id == appointment_id)
    )
    result = await session.execute(eager_stmt)
    return result.unique().scalar_one_or_none()


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
