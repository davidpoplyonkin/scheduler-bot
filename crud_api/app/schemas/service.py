from pydantic import BaseModel

from .config import config_dict


class ServiceBasicOut(BaseModel):
    """Service output without pricing - for appointment displays."""
    id: int
    name: str

    model_config = config_dict


class ServiceOut(ServiceBasicOut):
    """Service output with pricing - for booking form constraints."""
    amount_minor: int
    currency_code: int
