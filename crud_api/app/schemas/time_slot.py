from pydantic import BaseModel
import datetime

from .config import config_dict

class TimeSlotOut(BaseModel):
    id: int
    start_time: datetime.time

    model_config = config_dict

class ConstraintGetResponse(BaseModel):
    time_slots: list[TimeSlotOut]
    min_advance_minutes: int
    max_advance_days: int
    forbidden_weekdays: list[int]

    model_config = config_dict  
