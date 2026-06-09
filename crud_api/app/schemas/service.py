from pydantic import BaseModel

from .config import config_dict


class ServiceTranslationOut(BaseModel):
    language_code: str
    name: str

    model_config = config_dict


class ServiceOut(BaseModel):
    id: int
    translations: list[ServiceTranslationOut]

    model_config = config_dict
