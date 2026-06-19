from fastapi import APIRouter, Depends, Query, Header
from typing import Annotated
import datetime

from schemas import Role, ConstraintGetResponse, BlockUserGetResponse, BlockUserGetRequest, BlockOut, BlockAggregateOut, ServiceOut
from deps import authorize_current_user, DBSessionDep
from utils import get_today_in_tz, get_service_name
from config import MIN_ADVANCE_MINUTES, MAX_ADVANCE_DAYS, FORBIDDEN_WEEKDAYS
import crud

router = APIRouter(
    prefix="/shared",
    tags=["shared"],
)

@router.get(
    "/constraints",
    dependencies=[Depends(authorize_current_user([Role.USER, Role.ADMIN]))],
    response_model=ConstraintGetResponse
)
async def get_constraints(
    session: DBSessionDep,
    accept_language: Annotated[str, Header()] = "en",
) -> ConstraintGetResponse:
    """
    Return business rules required to render the date picker
    """
    time_slots = await crud.get_time_slots(session)
    services = await crud.get_services(session)
    return ConstraintGetResponse(
        time_slots=time_slots,
        services=[
            ServiceOut(id=s.id, name=get_service_name(s, accept_language))
            for s in services
        ],
        min_advance_minutes=MIN_ADVANCE_MINUTES,
        max_advance_days=MAX_ADVANCE_DAYS,
        forbidden_weekdays=FORBIDDEN_WEEKDAYS
    )

@router.get(
    "/blocks",
    dependencies=[Depends(authorize_current_user([Role.USER, Role.ADMIN]))],
    response_model=BlockUserGetResponse
)
async def get_blocks(
    session: DBSessionDep,
    request: Annotated[BlockUserGetRequest, Query()]
) -> BlockUserGetResponse:
    """
    Return blocked time slots for the given month
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
