from pydantic import BaseModel, Field, AliasPath
import datetime

from .config import config_dict

class AppointmentResponse(BaseModel):
    date: datetime.date
    time: datetime.time = Field(validation_alias=AliasPath("time_slot", "start_time"))

    model_config = config_dict
