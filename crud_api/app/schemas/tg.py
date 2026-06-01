from pydantic import BaseModel
from typing import Optional, Generic, TypeVar

from .config import config_dict

T = TypeVar('T')

class TgBaseResponse(BaseModel, Generic[T]):
    ok: bool
    result: Optional[T] = None
    error_code: Optional[int] = None
    description: Optional[str] = None

    # Deliberately not using config because Telegram API uses snake_case
    # keys, not camelCase
    # model_config = config_dict

class TgMessage(BaseModel):
    message_id: int

class TgSendMessageRequest(BaseModel):
    chat_id: int
    text: str
    parse_mode: Optional[str] = None

class TgSendMessageResponse(TgBaseResponse[TgMessage]):
    pass

class TgDeleteMessageRequest(BaseModel):
    chat_id: int
    message_id: int

class TgDeleteMessageResponse(TgBaseResponse[bool]):
    pass
