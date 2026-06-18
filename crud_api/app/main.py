from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import router_auth, router_user, router_admin, router_shared, router_webhook
from config import API_ALLOW_ORIGINS

app = FastAPI()

app.include_router(router_auth)
app.include_router(router_user)
app.include_router(router_admin)
app.include_router(router_shared)
app.include_router(router_webhook)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
