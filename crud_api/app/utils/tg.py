import httpx

from config import TG_API_URL
from schemas import (TgMessage, TgSendMessageRequest, TgSendMessageResponse,
                     TgDeleteMessageRequest, TgDeleteMessageResponse)

async def send_msg(chat_id: int, text: str, parse_mode: str | None = None) -> TgMessage | None:
    request = TgSendMessageRequest(chat_id=chat_id, text=text, parse_mode=parse_mode)

    async with httpx.AsyncClient() as client:
        api_response = await client.post(
            TG_API_URL + "/sendMessage",
            json=request.model_dump(exclude_none=True)
        )

    response = TgSendMessageResponse.model_validate(api_response.json())
    
    return response.result

async def del_msg(chat_id: int, message_id: int) -> bool | None:
    request = TgDeleteMessageRequest(chat_id=chat_id, message_id=message_id)

    async with httpx.AsyncClient() as client:
        api_response = await client.post(
            TG_API_URL + "/deleteMessage",
            json=request.model_dump(exclude_none=True)
        )

    response = TgDeleteMessageResponse.model_validate(api_response.json())
    return response.result
