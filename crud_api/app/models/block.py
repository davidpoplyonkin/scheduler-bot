from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Date, Integer, UniqueConstraint
import datetime

from database import Base
from models import TimeSlot

class Block(Base):
    __tablename__ = "blocks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    time_slot_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("time_slots.id"),
        nullable=False
    )

    time_slot: Mapped[TimeSlot] = relationship()

    __table_args__ = (
        UniqueConstraint("date", "time_slot_id", name="uq_date_time_slot"),
    )
