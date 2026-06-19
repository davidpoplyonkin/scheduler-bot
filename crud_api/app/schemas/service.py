from pydantic import BaseModel

from .config import config_dict


class ServiceOut(BaseModel):
    id: int
    name: str

    model_config = config_dict
