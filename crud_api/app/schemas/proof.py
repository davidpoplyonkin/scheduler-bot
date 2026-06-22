from pydantic import BaseModel
import datetime

from .config import config_dict
from .service import ServiceBasicOut


class ProofGenerateRequest(BaseModel):
    appointment_id: int

    model_config = config_dict


class ProofGenerateResponse(BaseModel):
    appointment_id: int
    claimant_id: int
    auth_date: str
    hash: str

    model_config = config_dict


class ProofVerifyRequest(BaseModel):
    appointment_id: int
    claimant_id: int
    auth_date: str
    hash: str

    model_config = config_dict


class ProofVerifyResponse(BaseModel):
    appointment_id: int
    user_name: str
    appointment_date: datetime.date
    appointment_time: datetime.time
    service: ServiceBasicOut

    model_config = config_dict
