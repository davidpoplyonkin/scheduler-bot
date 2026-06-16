import httpx

from config import MONOBANK_TOKEN, MONOBANK_API_URL, MONOBANK_REDIRECT_URL, MONOBANK_WEBHOOK_URL
from schemas.monobank import InvoiceCreateRequest, InvoiceCreateResponse, MerchantPaymInfo


async def create_invoice(
    amount_minor: int,
    currency_code: int,
    reference: str,
    description: str | None = None,
) -> InvoiceCreateResponse | None:
    """
    Create a Monobank invoice and return (invoice_id, page_url).
    Returns None if invoice creation fails.
    """
    request = InvoiceCreateRequest(
        amount=amount_minor,
        ccy=currency_code,
        merchantPaymInfo=MerchantPaymInfo(
            reference=reference,
            destination=description,
        ),
        redirectUrl=MONOBANK_REDIRECT_URL,
        webHookUrl=MONOBANK_WEBHOOK_URL,
    )

    async with httpx.AsyncClient() as client:
        api_response = await client.post(
            f"{MONOBANK_API_URL}/api/merchant/invoice/create",
            headers={"X-Token": MONOBANK_TOKEN},
            json=request.model_dump(exclude_none=True),
        )

    if api_response.status_code != 200:
        return None

    response = InvoiceCreateResponse.model_validate(api_response.json())
    return response
