from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, BigInteger, Integer, String
from sqlalchemy.dialects.postgresql import ENUM
from typing import Optional
import enum

from database import Base
from models import Block, User, Service

class AppointmentStatus(enum.StrEnum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )
    block_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("blocks.id", ondelete="SET NULL"),
        nullable=True,
    )
    service_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("services.id"),
        nullable=False
    )
    invoice_id: Mapped[Optional[str]] = mapped_column(
        String(256),
        nullable=True,
    )
    status: Mapped[AppointmentStatus] = mapped_column(
        ENUM(AppointmentStatus),
        nullable=False
    )

    block: Mapped[Block] = relationship()
    user: Mapped[User] = relationship()
    service: Mapped[Service] = relationship()
