from fastapi import APIRouter, Depends

from schemas import WhoAmISchema, UserAuthSchema, Role
from deps import authorize_current_user

router = APIRouter(
    prefix="",
    tags=["user"],
)

@router.get("/", response_model=WhoAmISchema)
async def whoami(
    user: UserAuthSchema = Depends(authorize_current_user([Role.USER, Role.ADMIN]))
) -> WhoAmISchema:
    """
    Return the sender's Telegram ID
    """
    
    return WhoAmISchema(tg_id=user.tg_id)
