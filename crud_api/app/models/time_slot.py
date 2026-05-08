from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Time
from datetime import time

from database import Base

class TimeSlot(Base):
    __tablename__ = "time_slots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)