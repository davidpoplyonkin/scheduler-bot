from pydantic import BaseModel

from .config import config_dict


class MerchantPaymInfo(BaseModel):
    reference: str | None = None
    destination: str | None = None

    model_config = config_dict


class InvoiceCreateRequest(BaseModel):
    amount: int
    ccy: int = 980
    merchant_paym_info: MerchantPaymInfo | None = None
    redirect_url: str | None = None
    web_hook_url: str | None = None

    model_config = config_dict


class InvoiceCreateResponse(BaseModel):
    invoice_id: str
    page_url: str

    model_config = config_dict
