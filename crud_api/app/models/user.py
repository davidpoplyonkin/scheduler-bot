from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, BigInteger

from database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tg_id: Mapped[int] = mapped_column(
        BigInteger,
        index=True,
        unique=True,
        nullable=False
    )
    full_name: Mapped[str | None] = mapped_column(String(64), nullable=True)