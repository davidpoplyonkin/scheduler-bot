from pydantic import BaseModel, Field, AliasPath
import datetime

from .config import config_dict

class AppointmentUserGetResponse(BaseModel):
    id: int
    date: datetime.date = Field(validation_alias=AliasPath("block", "date"))
    time: datetime.time = Field(
        validation_alias=AliasPath("block", "time_slot", "start_time")
    )

    model_config = config_dict

class AppointmentReserveRequest(BaseModel):
    date: datetime.date
    time_slot_id: int

    model_config = config_dict

class AppointmentReserveResponse(BaseModel):
    id: int
    date: datetime.date
    time: datetime.time

    model_config = config_dict
