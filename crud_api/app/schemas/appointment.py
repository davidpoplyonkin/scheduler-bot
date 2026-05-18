from pydantic import BaseModel, Field, AliasPath
import datetime

from .config import config_dict

class AppointmentUserGetResponse(BaseModel):
    date: datetime.date = Field(validation_alias=AliasPath("block", "date"))
    time: datetime.time = Field(
        validation_alias=AliasPath("block", "time_slot", "start_time")
    )

    model_config = config_dict
