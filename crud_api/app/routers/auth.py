from fastapi import APIRouter, Response, HTTPException
from starlette import status
import jwt
from urllib.parse import parse_qsl
import json
from datetime import datetime, timezone, timedelta

from schemas import Role, TokenGetRequest, TokenGetResponse
from utils import verify_init_data, InitDataInvalid, InitDataExpired
from crud import upsert_user
from deps import DBSessionDep
from config import ADMIN_TG_ID, JWT_SECRET, JWT_ALGORITHM, JWT_EXP_SECONDS, TG_SECRET_KEY

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.post("/token", response_model=TokenGetResponse)
async def issue_token(
    session: DBSessionDep,
    request: TokenGetRequest,
    response: Response
) -> TokenGetResponse:
    """
    Exchange Telegram InitData for a JWT
    """

    # Parse Telegram InitData
    init_data_dict = dict(parse_qsl(request.init_data))

    try:
        verify_init_data(init_data_dict, TG_SECRET_KEY)
    except InitDataInvalid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram Init Data",
        )
    except InitDataExpired:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired Telegram Init Data",
        )

    user_dict = json.loads(init_data_dict.get("user"))
    tg_id = int(user_dict.get("id"))

    names = [n for k in ["first_name", "last_name"] if (n := user_dict.get(k))]
    full_name = " ".join(names) or None
    
    user = await upsert_user(session, tg_id, full_name)

    role = Role.ADMIN if tg_id == ADMIN_TG_ID else Role.USER
    
    payload = {
        "sub": str(user.id),
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
    
    return TokenGetResponse(role=role)
