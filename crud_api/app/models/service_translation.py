from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from typing import TYPE_CHECKING

from database import Base

if TYPE_CHECKING:
    from models.service import Service


class ServiceTranslation(Base):
    __tablename__ = "service_translations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    service_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
    )
    language_code: Mapped[str] = mapped_column(String(8), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)

    service: Mapped["Service"] = relationship(back_populates="translations")

    __table_args__ = (
        UniqueConstraint("service_id", "language_code", name="uq_service_language"),
    )
