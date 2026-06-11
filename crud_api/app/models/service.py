from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from database import Base

if TYPE_CHECKING:
    from models.service_translation import ServiceTranslation


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    translations: Mapped[list["ServiceTranslation"]] = relationship(
        back_populates="service",
        lazy="selectin"
    )
