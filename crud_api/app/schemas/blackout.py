from pydantic import BaseModel, model_validator
import datetime

from .config import config_dict

class BlackoutCreateRequest(BaseModel):
    start_date: datetime.date
    end_date: datetime.date
    slots: list[int] = []

    model_config = config_dict

    @model_validator(mode="after")
    def validate_slots_require_single_date(self):
        if len(self.slots) > 0 and self.start_date != self.end_date:
            raise ValueError(
                "When specific slots are provided, start_date must equal end_date"
            )
        if self.start_date > self.end_date:
            raise ValueError("start_date must be less than or equal to end_date")
        return self

class BlackoutCreateResponse(BaseModel):
    created_count: int
    model_config = config_dict
