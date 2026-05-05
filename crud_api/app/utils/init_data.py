from fastapi import HTTPException
from starlette import status
import hmac
import hashlib
from time import time

from config import TG_TOKEN, INIT_DATA_EXP_SECONDS

def get_init_data_hash(
    data: dict[str, str], # without "hash" key
) -> str:
    # https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

    # Derive the string encrypted by Telegram
    check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(data.items())
    )

    # Derive the key used by Telegram
    secret_key = hmac.new(
        b"WebAppData", 
        TG_TOKEN.encode(), 
        hashlib.sha256
    ).digest()

    # Calculate the authentic hash
    hash = hmac.new(
        secret_key, 
        check_string.encode(), 
        hashlib.sha256
    ).hexdigest()

    return hash

def verify_init_data(
    data: dict[str, str], # with "hash" key
) -> None:
    
    init_data_invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Telegram Init Data",
    )
    init_data_expired = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Expired Telegram Init Data",
    )

    try:
        init_data_hash = data.pop("hash")
    except KeyError:
        raise init_data_invalid
    
    authentic_hash = get_init_data_hash(data)

    # Ensure that the hashes match
    if not hmac.compare_digest(authentic_hash, init_data_hash):
        raise init_data_invalid
    
    # Check if InitData is expired
    if int(time()) - int(data.get("auth_date", 0)) > INIT_DATA_EXP_SECONDS:
        raise init_data_expired