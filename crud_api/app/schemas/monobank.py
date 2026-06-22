import enum

from pydantic import BaseModel

from .config import config_dict


class InvoiceStatus(enum.StrEnum):
    CREATED = "created"
    PROCESSING = "processing"
    HOLD = "hold"
    SUCCESS = "success"
    FAILURE = "failure"
    REVERSED = "reversed"
    EXPIRED = "expired"


class MerchantPaymInfo(BaseModel):
    reference: str | None = None
    destination: str | None = None

    model_config = config_dict


class InvoiceCreateRequest(BaseModel):
    amount: int
    ccy: int
    merchant_paym_info: MerchantPaymInfo | None = None
    redirect_url: str | None = None
    web_hook_url: str | None = None
    validity: int

    model_config = config_dict


class InvoiceCreateResponse(BaseModel):
    invoice_id: str
    page_url: str

    model_config = config_dict


class InvoiceStatusResponse(BaseModel):
    invoice_id: str
    status: InvoiceStatus
    amount: int
    ccy: int
    reference: int

    model_config = config_dict
