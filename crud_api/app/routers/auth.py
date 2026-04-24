from fastapi import APIRouter, Response
import jwt
from urllib.parse import parse_qsl
import json
from datetime import datetime, timezone, timedelta

from schemas import Role, TokenRequest, TokenResponse
from utils import verify_init_data
from config import ADMIN_TG_ID, JWT_SECRET, JWT_ALGORITHM, JWT_EXP_SECONDS

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.post("/token", response_model=TokenResponse)
async def issue_token(
    request: TokenRequest,
    response: Response
) -> TokenResponse:
    """
    Exchange Telegram InitData for a JWT
    """

    # Parse Telegram InitData
    init_data_dict = dict(parse_qsl(request.init_data))

    verify_init_data(init_data_dict)
    
    user = json.loads(init_data_dict.get("user"))
    tg_id = str(user.get("id"))
    role = Role.ADMIN if tg_id == ADMIN_TG_ID else Role.USER
    
    payload = {
        "sub": tg_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=JWT_EXP_SECONDS),
    }

    # Generate the token
    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    # Attach the token as a cookie
    response.set_cookie(
        key="token", 
        value=token, 
        httponly=True,
        max_age=JWT_EXP_SECONDS,
        expires=JWT_EXP_SECONDS,
        samesite="lax",
        secure=True
    )
    
    return TokenResponse(role=role)
