from fastapi import APIRouter

from deps import DBSessionDep, MonobankWebhookPayload
from schemas.monobank import InvoiceStatus
from utils.invoice_checker import on_payment_success, cancel_invoice_check
import crud

router = APIRouter(
    prefix="/webhook",
    tags=["webhook"],
)


@router.post("/monobank")
async def handle_monobank_webhook(
    session: DBSessionDep,
    payload: MonobankWebhookPayload,
) -> dict:
    """Handle Monobank invoice status webhook."""
    if payload.status == InvoiceStatus.SUCCESS:
        await cancel_invoice_check(payload.invoice_id)
        await on_payment_success(session, payload.reference)

    elif payload.status in (InvoiceStatus.FAILURE, InvoiceStatus.REVERSED):
        await cancel_invoice_check(payload.invoice_id)
        await crud.cancel_appointment_invoice(session, payload.reference)

    return {"status": "ok"}
