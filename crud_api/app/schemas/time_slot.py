from pydantic import BaseModel
import datetime

from .config import config_dict

class TimeSlotOut(BaseModel):
    id: int
    start_time: datetime.time

    model_config = config_dict

class ConstraintGetResponse(BaseModel):
    time_slots: list[TimeSlotOut]

    model_config = config_dict  
