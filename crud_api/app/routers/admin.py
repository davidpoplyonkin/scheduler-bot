from fastapi import APIRouter, Depends
import datetime

from schemas import Role, AppointmentAdminGetResponse, BlackoutCreateRequest, BlackoutCreateResponse
from deps import authorize_current_user, DBSessionDep
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
