from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import router_auth, router_user, router_admin, router_shared
from config import API_ALLOW_ORIGINS
from exceptions import AppException
from utils.translations import t

app = FastAPI()


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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
