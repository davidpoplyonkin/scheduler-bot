from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Date, BigInteger, Integer, Index
import datetime

from database import Base
from models import TimeSlot

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
    )
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    time_slot_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("time_slots.id"),
        nullable=False
    )

    time_slot: Mapped[TimeSlot] = relationship()

    __table_args__ = (
        Index("ix_user_date", "user_id", "date"),
    )
