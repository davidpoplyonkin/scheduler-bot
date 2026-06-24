from fastapi import APIRouter, Depends, Header
from typing import Annotated

from exceptions import AppException
from starlette import status

from schemas import (Role, AppointmentAdminOut, BlackoutCreateRequest,
                     BlackoutCreateResponse, ProofVerifyRequest, ProofVerifyResponse,
                     ServiceBasicOut)
from models.appointment import AppointmentStatus
from deps import authorize_current_user, DBSessionDep
from utils import verify_init_data, InitDataInvalid, InitDataExpired, get_service_name
from config import QR_SECRET_KEY
import crud

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


@router.get(
    "/appointments",
    dependencies=[Depends(authorize_current_user([Role.ADMIN]))],
    response_model=list[AppointmentAdminOut]
)
async def get_appointments(
    session: DBSessionDep,
    accept_language: Annotated[str, Header()] = "en",
) -> list[AppointmentAdminOut]:
    appointments = await crud.get_admin_appointments(session)

    return [
        AppointmentAdminOut(
            id=appt.id,
            date=appt.block.date,
            time=appt.block.time_slot.start_time,
            user_id=appt.user_id,
            user_full_name=appt.user.full_name,
            service=ServiceBasicOut(
                id=appt.service.id,
                name=get_service_name(appt.service, accept_language)
            ),
            status=appt.status,
        )
        for appt in appointments
    ]


@router.post(
    "/blackout",
    dependencies=[Depends(authorize_current_user([Role.ADMIN]))],
    response_model=BlackoutCreateResponse
)
async def create_blackout(
    session: DBSessionDep,
    request: BlackoutCreateRequest,
) -> BlackoutCreateResponse:
    created_count = await crud.create_blackouts(
        session=session,
        start_date=request.start_date,
        end_date=request.end_date,
        slots=request.slots,
    )
    return BlackoutCreateResponse(created_count=created_count)


@router.post(
    "/proofs/verify",
    dependencies=[Depends(authorize_current_user([Role.ADMIN]))],
    response_model=ProofVerifyResponse
)
async def verify_proof(
    session: DBSessionDep,
    request: ProofVerifyRequest,
    accept_language: Annotated[str, Header()] = "en",
) -> ProofVerifyResponse:
    # Build data dict for verification (include hash)
    data = {
        "appointment_id": str(request.appointment_id),
        "claimant_id": str(request.claimant_id),
        "auth_date": request.auth_date,
        "hash": request.hash,
    }

    # Verify HMAC and expiration
    try:
        verify_init_data(data, QR_SECRET_KEY)
    except InitDataInvalid:
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="error.invalidQr",
            non_critical=True,
            non_sensitive=True,
        )
    except InitDataExpired:
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="error.qrExpired",
            non_critical=True,
            non_sensitive=True,
        )

    # Optimistic update: try to complete appointment with conditions
    appointment = await crud.complete_appointment(
        session,
        request.appointment_id,
        request.claimant_id,
    )

    # Success - appointment was CONFIRMED and owned by claimant
    if appointment is not None:
        return ProofVerifyResponse(
            appointment_id=request.appointment_id,
            user_name=appointment.user.full_name or f"User {appointment.user_id}",
            appointment_date=appointment.block.date,
            appointment_time=appointment.block.time_slot.start_time,
            service=ServiceBasicOut(
                id=appointment.service.id,
                name=get_service_name(appointment.service, accept_language)
            )
        )

    # Update failed - fetch appointment to determine the cause
    appointment = await crud.get_appointment_by_id(session, request.appointment_id)

    if appointment is None:
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="error.appointmentNotFound",
            non_critical=True,
            non_sensitive=True,
        )

    if appointment.user_id != request.claimant_id:
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="error.appointmentNotOwned",
            non_critical=True,
            non_sensitive=True,
        )

    # Status-specific errors
    if appointment.status == AppointmentStatus.PENDING:
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="error.appointmentPending",
            non_critical=True,
            non_sensitive=True,
        )
    elif appointment.status == AppointmentStatus.CANCELLED:
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="error.appointmentCancelled",
            non_critical=True,
            non_sensitive=True,
        )
    elif appointment.status == AppointmentStatus.COMPLETED:
        raise AppException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="error.appointmentAlreadyCompleted",
            non_critical=True,
            non_sensitive=True,
        )
    
    raise AppException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="error.invalidAppointmentStatus",
        non_critical=True,
        non_sensitive=False,
    )
