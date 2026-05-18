from datetime import datetime
from zoneinfo import ZoneInfo

from config import IANA_TZ

def get_today_in_tz(iana_tz: str = IANA_TZ) -> datetime:
    tz = ZoneInfo(iana_tz)
    today = datetime.now(tz)
    return today