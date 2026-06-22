import asyncio
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from database import sessionmanager
from models import Appointment
from config import (INVOICE_CHECK_DELAY_SECONDS, INVOICE_CHECK_MAX_RETRIES,
                    ADMIN_TG_ID, APPOINTMENT_DURATION_MINUTES)
from schemas.monobank import InvoiceStatus
from utils.monobank import get_invoice_status
from utils.notifications import get_scheduler, send_notification
from utils.today_in_tz import get_today_in_tz
from utils.translations import t, format_date, escape_markdownv2
from utils.google_calendar import create_calendar_event
import crud


async def check_invoice_status(
    invoice_id: str,
    retries_left: int,
) -> None:
    """Check invoice status and take action based on result."""
    async with sessionmanager.session() as session:
        status_response = await get_invoice_status(invoice_id)

        if status_response is None:
            # API error - reschedule if retries remain
            if retries_left > 0:
                await schedule_invoice_check(invoice_id, retries_left - 1)
            return

        status = status_response.status
        appointment_id = status_response.reference

        if status in (InvoiceStatus.CREATED, InvoiceStatus.PROCESSING):
            # Still pending - reschedule if retries remain
            if retries_left > 0:
                await schedule_invoice_check(invoice_id, retries_left - 1)
            else:
                # No retries left, cancel
                await crud.cancel_appointment_invoice(session, appointment_id)
            return

        if status == InvoiceStatus.SUCCESS:
            # Payment successful - confirm, notify admin, create calendar event
            await on_payment_success(session, appointment_id)
            return

        if status in (InvoiceStatus.FAILURE, InvoiceStatus.EXPIRED, InvoiceStatus.REVERSED):
            # Payment failed - cancel appointment and free up block
            await crud.cancel_appointment_invoice(session, appointment_id)
            return


async def schedule_invoice_check(
    invoice_id: str,
    retries_left: int,
) -> None:
    """Schedule a job to check invoice status."""

    scheduler = await get_scheduler()

    scheduler.add_job(
        id=f"check_invoice_{invoice_id}",
        func=check_invoice_status,
        trigger="date",
        run_date=get_today_in_tz() + timedelta(seconds=INVOICE_CHECK_DELAY_SECONDS),
        args=[invoice_id, retries_left],
        replace_existing=True,
    )


async def cancel_invoice_check(invoice_id: str) -> None:
    """Cancel the polling job for an invoice (called when webhook arrives)."""
    scheduler = await get_scheduler()
    job_id = f"check_invoice_{invoice_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)


async def on_payment_success(session: AsyncSession, appointment_id: int) -> None:
    """
    Handle successful payment: notify admin and create calendar event.
    This is the new home for logic previously in reserve_appointment router.
    """
    appointment = await crud.confirm_appointment_payment(session, appointment_id)

    if not appointment:
        return
        
    admin = await crud.get_user_by_tg_id(session, ADMIN_TG_ID)
    lang = admin.language_code if admin else None

    date_str = escape_markdownv2(format_date(appointment.block.date, lang))
    time_str = escape_markdownv2(
        appointment.block.time_slot.start_time.strftime("%H:%M")
    )

    # Get service name with translation fallback
    service_translations = {
        tr.language_code: tr.name for tr in appointment.service.translations
    }
    service_name = (
        service_translations.get(lang)
        or service_translations.get("en")
        or ""
    )
    service_str = escape_markdownv2(service_name)

    # Create calendar event
    asyncio.create_task(create_calendar_event(
        event_date=appointment.block.date,
        event_time=appointment.block.time_slot.start_time,
        duration_minutes=APPOINTMENT_DURATION_MINUTES
    ))

    # Notify admin
    await send_notification(
        ADMIN_TG_ID,
        (
            f"*{t('New booking:', lang)}*\n"
            f"{service_str}{chr(10) if service_str else ''}"
            f"{date_str} {t('at', lang)} {time_str}"
        ),
        parse_mode="MarkdownV2"
    )
