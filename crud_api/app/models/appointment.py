from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, BigInteger, Integer

from database import Base
from models import Block, User

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )
    block_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("blocks.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    service_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("services.id"),
        nullable=False
    )

    block: Mapped[Block] = relationship()
    user: Mapped[User] = relationship()
