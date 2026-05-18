from fastapi import APIRouter, Depends, Query
from typing import List, Annotated
from datetime import datetime

from schemas import (UserAuthSchema, Role, AppointmentUserGetResponse,
                     ConstraintGetResponse, BlockUserGetRequest,
                     BlockUserGetResponse, BlockAggregateOut, BlockOut)
from deps import authorize_current_user, DBSessionDep
from utils import get_today_in_tz
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
    return ConstraintGetResponse(time_slots=time_slots)

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
    month_first_date = datetime.strptime(request.month + "-01", "%Y-%m-%d")

    next_month = month_first_date.month % 12 + 1
    next_year = month_first_date.year + (month_first_date.month // 12)
    next_month_first_date = datetime(next_year, next_month, 1)

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
