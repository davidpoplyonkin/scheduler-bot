from pydantic import BaseModel

class WhoAmISchema(BaseModel):
    tg_id: str
    