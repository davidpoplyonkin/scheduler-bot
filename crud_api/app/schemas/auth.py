from pydantic import BaseModel
from enum import Enum

from .config import config_dict

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"

class UserAuthSchema(BaseModel):
    id: int
    role: Role

class TokenGetRequest(BaseModel):
    init_data: str

    model_config = config_dict

class TokenGetResponse(BaseModel):
    role: Role

    model_config = config_dict
