from fastapi import APIRouter, Depends

from exceptions import AppException
from starlette import status
import datetime

from schemas import (Role, AppointmentAdminGetResponse, BlackoutCreateRequest,
                     BlackoutCreateResponse, ProofVerifyRequest, ProofVerifyResponse)
from deps import authorize_current_user, DBSessionDep
from utils import verify_init_data, InitDataInvalid, InitDataExpired
from config import QR_SECRET_KEY
import crud

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


@router.get(
    "/appointments",
    dependencies=[Depends(authorize_current_user([Role.ADMIN]))],
    response_model=AppointmentAdminGetResponse
)
async def get_appointments(
    session: DBSessionDep,
) -> AppointmentAdminGetResponse:
    appointments = await crud.get_admin_appointments(session)

    # Aggregate by date
    appointments_by_date: dict[datetime.date, list] = {}
    for appt in appointments:
        date_key = appt.block.date
        if date_key not in appointments_by_date:
            appointments_by_date[date_key] = []
        appointments_by_date[date_key].append({
            "id": appt.id,
            "time": appt.block.time_slot.start_time,
            "user_id": appt.user_id,
            "user_full_name": appt.user.full_name,
            "service": appt.service,
        })

    return AppointmentAdminGetResponse(
        days=[
            {"date": date, "appointments": appts}
            for date, appts in sorted(appointments_by_date.items())
        ]
    )


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

    # Fetch and verify ownership
    appointment = await crud.get_appointment_with_user(
        session,
        request.appointment_id
    )

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

    # Success
    return ProofVerifyResponse(
        appointment_id=request.appointment_id,
        user_name=appointment.user.full_name or f"User {appointment.user_id}",
        appointment_date=appointment.block.date,
        appointment_time=appointment.block.time_slot.start_time,
        service=appointment.service,
    )
