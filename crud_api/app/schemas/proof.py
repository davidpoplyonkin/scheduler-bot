from pydantic import BaseModel

from .config import config_dict


class ProofGenerateRequest(BaseModel):
    appointment_id: int

    model_config = config_dict


class ProofGenerateResponse(BaseModel):
    appointment_id: int
    claimant_id: int
    auth_date: str
    hash: str

    model_config = config_dict
