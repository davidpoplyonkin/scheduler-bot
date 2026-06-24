from typing import AsyncGenerator
import asyncio
import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
import redis.asyncio as redis

from deps import authorize_current_user
from schemas import UserAuthSchema, Role

router = APIRouter(prefix="/sse", tags=["sse"])

HEARTBEAT_INTERVAL = 15  # seconds


async def event_generator(
    request: Request,
    user: UserAuthSchema,
) -> AsyncGenerator[str, None]:
    redis_client: redis.Redis = request.app.state.redis
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("appointment_updates")

    try:
        yield "event: connected\ndata: {}\n\n"

        while True:
            if await request.is_disconnected():
                break

            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=HEARTBEAT_INTERVAL
            )

            if message is not None:
                payload = json.loads(message["data"])

                # Ignore setup messages
                if message["type"] != "message":
                    message = None

            if message is not None:
                # Ignore the messages not intended for the current user
                if user.role != Role.ADMIN and payload["user_id"] != user.id:
                    message = None

            if message is None:
                # Send heartbeat to keep connection alive
                yield ":heartbeat\n\n"
                continue

            # Send only id and status to client
            event_data = {"id": payload["id"], "status": payload["status"]}
            yield f"data: {json.dumps(event_data)}\n\n"
    finally:
        await pubsub.unsubscribe("appointment_updates")
        await pubsub.close()


@router.get("/appointments")
async def appointments_stream(
    request: Request,
    user: UserAuthSchema = Depends(authorize_current_user([Role.USER, Role.ADMIN]))
) -> StreamingResponse:
    return StreamingResponse(
        event_generator(request, user),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        },
    )
