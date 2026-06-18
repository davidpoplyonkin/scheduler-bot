from pydantic import BaseModel, Field, AliasPath
import datetime

from .config import config_dict
from .service import ServiceOut
from models.appointment import AppointmentStatus

class AppointmentUserGetResponse(BaseModel):
    id: int
    date: datetime.date = Field(validation_alias=AliasPath("block", "date"))
    time: datetime.time = Field(
        validation_alias=AliasPath("block", "time_slot", "start_time")
    )
    service: ServiceOut
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
    payment_url: str

    model_config = config_dict


class AppointmentAdminOut(BaseModel):
    id: int
    time: datetime.time
    user_id: int
    user_full_name: str | None
    service: ServiceOut

    model_config = config_dict


class AppointmentAdminAggregateOut(BaseModel):
    date: datetime.date
    appointments: list[AppointmentAdminOut]

    model_config = config_dict


class AppointmentAdminGetResponse(BaseModel):
    days: list[AppointmentAdminAggregateOut]

    model_config = config_dict
