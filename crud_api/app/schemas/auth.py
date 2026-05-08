from pydantic import BaseModel
from enum import Enum

from .config import config_dict

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"

class UserAuthSchema(BaseModel):
    id: int
    role: Role

class TokenRequest(BaseModel):
    init_data: str

    model_config = config_dict

class TokenResponse(BaseModel):
    role: Role

    model_config = config_dict
