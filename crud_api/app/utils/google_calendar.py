import asyncio
import logging
from datetime import datetime, date, time, timedelta
from zoneinfo import ZoneInfo

from google.oauth2 import service_account
from googleapiclient.discovery import build

from config import (
    GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    ADMIN_GOOGLE_EMAIL,
    BOT_NAME,
    IANA_TZ
)

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def _get_calendar_service():
    credentials = service_account.Credentials.from_service_account_file(
        GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
        scopes=SCOPES
    )
    return build("calendar", "v3", credentials=credentials)


def _create_event_sync(
    event_date: date,
    event_time: time,
    duration_minutes: int
) -> str | None:
    service = _get_calendar_service()

    tz = ZoneInfo(IANA_TZ)
    start_datetime = datetime.combine(event_date, event_time, tzinfo=tz)
    end_datetime = start_datetime + timedelta(minutes=duration_minutes)

    event = {
        "summary": BOT_NAME,
        "start": {
            "dateTime": start_datetime.isoformat(),
            "timeZone": IANA_TZ,
        },
        "end": {
            "dateTime": end_datetime.isoformat(),
            "timeZone": IANA_TZ,
        },
    }

    created_event = service.events().insert(
        calendarId=ADMIN_GOOGLE_EMAIL,
        body=event
    ).execute()

    return created_event.get("id")


async def create_calendar_event(
    event_date: date,
    event_time: time,
    duration_minutes: int,
) -> str | None:
    """
    Create a Google Calendar event for an appointment.
    """

    try:
        event_id = await asyncio.to_thread(
            _create_event_sync, event_date, event_time, duration_minutes
        )
        return event_id

    except:
        # Fail silently to avoid blocking the booking flow.
        return None
