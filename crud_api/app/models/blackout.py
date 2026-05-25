from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Integer

from database import Base
from models import Block

class Blackout(Base):
    __tablename__ = "blackouts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    block_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("blocks.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    block: Mapped[Block] = relationship()
