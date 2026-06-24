from pydantic import BaseModel, Field, AliasPath
import datetime

from .config import config_dict
from .service import ServiceBasicOut
from models.appointment import AppointmentStatus

class AppointmentUserGetResponse(BaseModel):
    id: int
    date: datetime.date = Field(validation_alias=AliasPath("block", "date"))
    time: datetime.time = Field(
        validation_alias=AliasPath("block", "time_slot", "start_time")
    )
    service: ServiceBasicOut
    status: AppointmentStatus

    model_config = config_dict

class AppointmentReserveRequest(BaseModel):
    date: datetime.date
    time_slot_id: int
    service_id: int

    model_config = config_dict

class AppointmentReserveResponse(BaseModel):
    id: int
    date: datetime.date
    time: datetime.time
    payment_url: str | None

    model_config = config_dict


class AppointmentAdminOut(BaseModel):
    id: int
    date: datetime.date
    time: datetime.time
    user_id: int
    user_full_name: str | None
    service: ServiceBasicOut
    status: AppointmentStatus

    model_config = config_dict
