from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import router_auth, router_user, router_admin, router_shared
from config import API_ALLOW_ORIGINS
from exceptions import AppException

app = FastAPI()


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom AppException with structured response"""
    response_body = {"detail": exc.detail}

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
