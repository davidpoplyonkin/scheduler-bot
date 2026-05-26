import hmac
import hashlib
from time import time

from config import INIT_DATA_EXP_SECONDS


class InitDataInvalid(Exception):
    """Raised when hash verification fails"""
    pass


class InitDataExpired(Exception):
    """Raised when auth_date is too old"""
    pass


def get_init_data_hash(
    data: dict[str, str],
    secret_key: bytes,
) -> str:
    # https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

    # Derive the string encrypted by Telegram
    check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(data.items())
    )

    # Calculate the authentic hash
    hash = hmac.new(
        secret_key,
        check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    return hash


def verify_init_data(
    data: dict[str, str],  # with "hash" key
    secret_key: bytes,
) -> None:
    """
    Verify HMAC signature and expiration.
    Raises InitDataInvalid or InitDataExpired on failure.
    """
    try:
        provided_hash = data.pop("hash")
    except KeyError:
        raise InitDataInvalid()

    expected_hash = get_init_data_hash(data, secret_key)

    if not hmac.compare_digest(expected_hash, provided_hash):
        raise InitDataInvalid()

    if int(time()) - int(data.get("auth_date", 0)) > INIT_DATA_EXP_SECONDS:
        raise InitDataExpired()
