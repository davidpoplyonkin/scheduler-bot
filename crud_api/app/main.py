from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncpg
import redis.asyncio as redis

from routers import router_auth, router_user, router_admin, router_shared, router_webhook, router_sse
from config import API_ALLOW_ORIGINS, PG_USER, PG_PASSWORD, PG_DB, REDIS_PASSWORD
from exceptions import AppException
from utils.translations import t


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dedicated asyncpg connection for LISTEN (separate from SQLAlchemy pool)
    pg_conn = await asyncpg.connect(
        user=PG_USER,
        password=PG_PASSWORD,
        database=PG_DB,
        host="postgres",
    )

    redis_client = redis.Redis(
        host="redis",
        port=6379,
        password=REDIS_PASSWORD,
        decode_responses=True,
    )
    app.state.redis = redis_client

    async def redis_publisher(conn, pid, channel, payload):
        await redis_client.publish("appointment_updates", payload)

    await pg_conn.add_listener("appointment_updates", redis_publisher)

    yield

    await pg_conn.remove_listener("appointment_updates", redis_publisher)
    await pg_conn.close()
    await redis_client.close()


app = FastAPI(lifespan=lifespan)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom AppException with structured response"""
    lang = request.headers.get("Accept-Language", "en")

    # Translate detail if non_sensitive (safe to show to user)
    detail = t(exc.detail, lang) if exc.non_sensitive else exc.detail

    response_body = {"detail": detail}

    if exc.non_critical is not None:
        response_body["nonCritical"] = exc.non_critical
    if exc.non_sensitive is not None:
        response_body["nonSensitive"] = exc.non_sensitive

    return JSONResponse(
        status_code=exc.status_code,
        content=response_body,
        headers=exc.headers,
    )

app.include_router(router_auth)
app.include_router(router_user)
app.include_router(router_admin)
app.include_router(router_shared)
app.include_router(router_webhook)
app.include_router(router_sse)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
