from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Annotated
import datetime

from schemas import *
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

@router.get(
    "/constraints",
    dependencies=[Depends(authorize_current_user([Role.USER]))],
    response_model=ConstraintGetResponse
)
async def get_constraints(
    session: DBSessionDep,
) -> ConstraintGetResponse:
    """
    Return business rules required to render the date picker
    """
    time_slots = await crud.get_time_slots(session)
    return ConstraintGetResponse(
        time_slots=time_slots,
        min_advance_minutes=MIN_ADVANCE_MINUTES,
        max_advance_days=MAX_ADVANCE_DAYS,
        forbidden_weekdays=FORBIDDEN_WEEKDAYS
    )

@router.get(
    "/blocks",
    dependencies=[Depends(authorize_current_user([Role.USER]))],
    response_model=BlockUserGetResponse
)
async def get_blocks(
    session: DBSessionDep,
    request: Annotated[BlockUserGetRequest, Query()]
) -> BlockUserGetResponse:
    """
    Return blocked time slots for the current user
    """
    month_first_date = datetime.datetime.strptime(request.month + "-01", "%Y-%m-%d")

    next_month = month_first_date.month % 12 + 1
    next_year = month_first_date.year + (month_first_date.month // 12)
    next_month_first_date = datetime.datetime(next_year, next_month, 1)

    blocks_raw = await crud.get_blocks(
        session,
        month_first_date,
        next_month_first_date
    )

    blocks_by_date = {}
    for b in blocks_raw:
        if b.date not in blocks_by_date:
            blocks_by_date[b.date] = []
        blocks_by_date[b.date].append(BlockOut(time_slot_id=b.time_slot_id))

    blocks = [
        BlockAggregateOut(
            date=k,
            unavailable_slots=v
        ) for k, v in blocks_by_date.items()
    ]

    return BlockUserGetResponse(server_time=get_today_in_tz(), blocks=blocks)

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
