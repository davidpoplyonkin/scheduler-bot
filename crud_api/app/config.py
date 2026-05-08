import os

IANA_TZ = os.getenv("IANA_TZ")

API_ALLOW_ORIGINS = os.getenv("API_ALLOW_ORIGINS").split(",")

ADMIN_TG_ID = os.getenv("ADMIN_TG_ID")
TG_TOKEN = os.getenv("TG_TOKEN")
INIT_DATA_EXP_SECONDS = 60 * 60 * 24 * 3

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_EXP_SECONDS = 60 * 60
JWT_ALGORITHM = "HS256"

PG_USER = os.getenv("POSTGRES_USER")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD")
PG_DB = os.getenv("POSTGRES_DB")
DATABASE_URL = f"postgresql+asyncpg://{PG_USER}:{PG_PASSWORD}@postgres/{PG_DB}"
ALEMBIC_DATABASE_URL = f"postgresql://{PG_USER}:{PG_PASSWORD}@postgres/{PG_DB}"
