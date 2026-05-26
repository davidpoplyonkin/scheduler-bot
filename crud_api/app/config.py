import os
import hmac
import hashlib

IANA_TZ = os.getenv("IANA_TZ")

MIN_ADVANCE_MINUTES = int(os.getenv("MIN_ADVANCE_MINUTES"))
MAX_ADVANCE_DAYS = int(os.getenv("MAX_ADVANCE_DAYS"))
FORBIDDEN_WEEKDAYS = [
    int(d) for d in os.getenv("FORBIDDEN_WEEKDAYS", "5,6").split(",")
]

API_ALLOW_ORIGINS = os.getenv("API_ALLOW_ORIGINS").split(",")

ADMIN_TG_ID = int(os.getenv("ADMIN_TG_ID"))
TG_TOKEN = os.getenv("TG_TOKEN")
QR_TOKEN = os.getenv("QR_TOKEN")
INIT_DATA_EXP_SECONDS = 60 * 60 * 24 * 3

# Pre-computed HMAC secret keys
TG_SECRET_KEY = hmac.new(b"WebAppData", TG_TOKEN.encode(), hashlib.sha256).digest()
QR_SECRET_KEY = hmac.new(b"ProofData", QR_TOKEN.encode(), hashlib.sha256).digest()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_EXP_SECONDS = 60 * 60
JWT_ALGORITHM = "HS256"

PG_USER = os.getenv("POSTGRES_USER")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD")
PG_DB = os.getenv("POSTGRES_DB")
DATABASE_URL = f"postgresql+asyncpg://{PG_USER}:{PG_PASSWORD}@postgres/{PG_DB}"
ALEMBIC_DATABASE_URL = f"postgresql://{PG_USER}:{PG_PASSWORD}@postgres/{PG_DB}"
