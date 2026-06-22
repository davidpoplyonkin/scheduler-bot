import httpx
from base64 import b64decode
from typing import Annotated

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature
from fastapi import Depends, Header, HTTPException, Request, status

from config import MONOBANK_API_URL, MONOBANK_TOKEN
from schemas.monobank import InvoiceStatusResponse

# Cached public key
_cached_pubkey: bytes | None = None


async def get_pubkey(force_refresh: bool = False) -> bytes:
    """Get public key from cache or fetch from Monobank API."""
    global _cached_pubkey
    if _cached_pubkey is None or force_refresh:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{MONOBANK_API_URL}/api/merchant/pubkey",
                headers={"X-Token": MONOBANK_TOKEN},
            )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch Monobank public key",
            )
        _cached_pubkey = b64decode(response.json()["key"])
    return _cached_pubkey


async def verify_monobank_signature(
    request: Request,
    x_sign: Annotated[str, Header()],
    first_attempt: bool = True,
) -> InvoiceStatusResponse:
    """FastAPI dependency that verifies Monobank webhook signature and parses payload."""
    body = await request.body()
    pubkey = await get_pubkey(force_refresh=not first_attempt)

    try:
        public_key = load_pem_public_key(pubkey)
        signature = b64decode(x_sign)
        public_key.verify(signature, body, ec.ECDSA(hashes.SHA256()))
        return InvoiceStatusResponse.model_validate_json(body)
    except (InvalidSignature, Exception):
        if first_attempt:
            return await verify_monobank_signature(request, x_sign, first_attempt=False)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )


MonobankWebhookPayload = Annotated[InvoiceStatusResponse, Depends(verify_monobank_signature)]
