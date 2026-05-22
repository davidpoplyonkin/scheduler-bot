from pydantic import BaseModel, field_validator
from typing import List
import datetime

from .config import config_dict

class BlockUserGetRequest(BaseModel):
    month: str

    @field_validator("month")
    def validate_month(cls, v):
        try:
            datetime.datetime.strptime(v, "%Y-%m")
        except ValueError:
            raise ValueError("Invalid month format. Expected YYYY-MM.")
        return v
    
    model_config = config_dict

class BlockOut(BaseModel):
    time_slot_id: int

    model_config = config_dict

class BlockAggregateOut(BaseModel):
    date: datetime.date
    unavailable_slots: List[BlockOut]

    model_config = config_dict
    
class BlockUserGetResponse(BaseModel):
    server_time: datetime.datetime
    blocks: List[BlockAggregateOut]

    model_config = config_dict
