from datetime import datetime
from zoneinfo import ZoneInfo

from config import IANA_TZ

def get_today_in_tz(iana_tz: str = IANA_TZ) -> datetime.date:
    tz = ZoneInfo(iana_tz)
    
    # Get current time in the specified timezone and extract the date
    today = datetime.now(tz).date()
    return today