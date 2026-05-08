from fastapi import APIRouter, Depends
from typing import List

from schemas import AppointmentResponse, UserAuthSchema, Role
from deps import authorize_current_user, DBSessionDep
import crud

router = APIRouter(
    prefix="",
    tags=["user"],
)

@router.get("/appointments", response_model=List[AppointmentResponse])
async def get_user_appointments(
    session: DBSessionDep,
    user: UserAuthSchema = Depends(authorize_current_user([Role.USER]))
) -> List[AppointmentResponse]:
    """
    Return future appointments for the current user
    """

    return await crud.get_user_appointments(session, user.id)
