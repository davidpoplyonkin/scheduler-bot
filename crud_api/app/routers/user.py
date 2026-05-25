from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import datetime

from schemas import Role, AppointmentUserGetResponse, AppointmentReserveRequest, AppointmentReserveResponse, UserAuthSchema
from deps import authorize_current_user, DBSessionDep
from utils import get_today_in_tz
from config import MIN_ADVANCE_MINUTES, MAX_ADVANCE_DAYS, FORBIDDEN_WEEKDAYS
import crud

router = APIRouter(
    prefix="/user",
    tags=["user"],
)

@router.get("/appointments", response_model=List[AppointmentUserGetResponse])
async def get_appointments(
    session: DBSessionDep,
    user: UserAuthSchema = Depends(authorize_current_user([Role.USER]))
) -> List[AppointmentUserGetResponse]:
    """
    Return future appointments for the current user
    """

    return await crud.get_user_appointments(session, user.id)

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
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Date is too soon"
        )

    if request.date > max_date:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Date is too far in advance"
        )

    if request.date.weekday() in FORBIDDEN_WEEKDAYS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Appointments not available on this day"
        )

    appointment = await crud.reserve_appointment(
        session,
        user.id,
        request.date,
        request.time_slot_id
    )

    return AppointmentReserveResponse(
        id=appointment.id,
        date=appointment.block.date,
        time=appointment.block.time_slot.start_time
    )
