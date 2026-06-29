from fastapi import APIRouter, Depends, status, Header
from typing import Annotated

from exceptions import AppException
from typing import List
import asyncio
import datetime

from schemas import (Role, AppointmentUserGetResponse,
                     AppointmentReserveRequest, AppointmentReserveResponse,
                     ProofGenerateRequest, ProofGenerateResponse,
                     UserAuthSchema, ServiceBasicOut)
from deps import authorize_current_user, DBSessionDep
from utils import (get_today_in_tz, get_init_data_hash, create_invoice,
                   schedule_invoice_check, get_service_name, on_payment_success)
from config import (MIN_ADVANCE_MINUTES, MAX_ADVANCE_DAYS, FORBIDDEN_WEEKDAYS,
                    QR_SECRET_KEY, INVOICE_CHECK_MAX_RETRIES)
import crud

router = APIRouter(
    prefix="/user",
    tags=["user"],
)

@router.get("/appointments", response_model=List[AppointmentUserGetResponse])
async def get_appointments(
    session: DBSessionDep,
    accept_language: Annotated[str, Header()] = "en",
    user: UserAuthSchema = Depends(authorize_current_user([Role.USER])),
) -> List[AppointmentUserGetResponse]:
    """
    Return future appointments for the current user
    """
    appointments = await crud.get_user_appointments(session, user.id)

    return [
        AppointmentUserGetResponse(
            id=appt.id,
            date=appt.block.date,
            time=appt.block.time_slot.start_time,
            service=ServiceBasicOut(
                id=appt.service.id,
                name=get_service_name(appt.service, accept_language)
            ),
            status=appt.status
        )
        for appt in appointments
    ]

@router.post("/appointments", response_model=AppointmentReserveResponse)
async def reserve_appointment(
    session: DBSessionDep,
    request: AppointmentReserveRequest,
    user: UserAuthSchema = Depends(authorize_current_user([Role.USER])),
) -> AppointmentReserveResponse:
    """
    Reserve an appointment for the current user
    """
    now = get_today_in_tz()
    min_date = (now + datetime.timedelta(minutes=MIN_ADVANCE_MINUTES)).date()
    max_date = (now + datetime.timedelta(days=MAX_ADVANCE_DAYS)).date()

    if request.date < min_date:
        raise AppException(
            status_code=status.HTTP_409_CONFLICT,
            detail="error.dateTooSoon",
            non_critical=True,
            non_sensitive=True,
        )

    if request.date > max_date:
        raise AppException(
            status_code=status.HTTP_409_CONFLICT,
            detail="error.dateTooFar",
            non_critical=True,
            non_sensitive=True,
        )

    if request.date.weekday() in FORBIDDEN_WEEKDAYS:
        raise AppException(
            status_code=status.HTTP_409_CONFLICT,
            detail="error.dayUnavailable",
            non_critical=True,
            non_sensitive=True,
        )

    appointment = await crud.reserve_appointment(
        session,
        user.id,
        request.date,
        request.time_slot_id,
        request.service_id
    )

    # Free service - confirm immediately with calendar + notification
    if appointment.service.amount_minor == 0:
        await on_payment_success(session, appointment.id)
        return AppointmentReserveResponse(
            id=appointment.id,
            date=appointment.block.date,
            time=appointment.block.time_slot.start_time,
            payment_url=None
        )

    # Create payment invoice via bank API
    invoice_result = await create_invoice(
        amount_minor=appointment.service.amount_minor,
        currency_code=appointment.service.currency_code,
        reference=str(appointment.id),
        description=appointment.service.destination_template,
    )

    if invoice_result is None:
        await crud.cancel_appointment_invoice(session, appointment.id)
        raise AppException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="error.invoiceFailed",
            non_critical=True,
            non_sensitive=True,
        )

    appointment = await crud.confirm_appointment_invoice(
        session,
        appointment.id,
        invoice_result.invoice_id
    )

    # Schedule invoice status check (handles notification + calendar on success)
    asyncio.create_task(schedule_invoice_check(
        invoice_id=invoice_result.invoice_id,
        retries_left=INVOICE_CHECK_MAX_RETRIES
    ))

    return AppointmentReserveResponse(
        id=appointment.id,
        date=appointment.block.date,
        time=appointment.block.time_slot.start_time,
        payment_url=invoice_result.page_url
    )

@router.post("/proofs/generate", response_model=ProofGenerateResponse)
async def generate_proof(
    request: ProofGenerateRequest,
    user: UserAuthSchema = Depends(authorize_current_user([Role.USER])),
) -> ProofGenerateResponse:
    # IMPORTANT: the hash is calculated with the keys in snake case, but the
    # user receives those in camel case. That is why, the admin must send
    # QR code data for verification as a JSON dict rather than a string, so that
    # Pydantic could convert camel case back to snake case.
    data = {
        "appointment_id": request.appointment_id,
        "claimant_id": user.id,
        "auth_date": str(int(get_today_in_tz().timestamp())),
    }

    proof_hash = get_init_data_hash(data, QR_SECRET_KEY)

    return ProofGenerateResponse(
        appointment_id=request.appointment_id,
        claimant_id=user.id,
        auth_date=data["auth_date"],
        hash=proof_hash,
    )
