from fastapi import Cookie, Depends, HTTPException
from typing import Optional
from starlette import status
import jwt

from config import JWT_SECRET, JWT_ALGORITHM
from schemas import UserAuthSchema, Role

async def get_current_user(
    token: Optional[str] = Cookie(None),
) -> UserAuthSchema:
    """
    Get the current user from the JWT
    """

    try:
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "role", "exp"]}
        )

        return UserAuthSchema(
            id=int(payload.get("sub")),
            role=payload.get("role"),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired Token",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token",
        )

# https://medium.com/@bhagyarana80/how-i-built-a-role-based-access-control-system-with-fastapi-and-pydantic-2c49e967efb0
def authorize_current_user(allowed_roles: list[Role]):
    def wrapper(
        user: UserAuthSchema = Depends(get_current_user)
    ) -> UserAuthSchema:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role: {user.role}"
            )
        return user
    return wrapper
