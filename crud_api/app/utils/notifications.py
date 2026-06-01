from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.redis import RedisJobStore
from datetime import timedelta

from config import REDIS_PASSWORD, NOTIFICATION_DELETE_SECONDS
from utils import send_msg, del_msg, get_today_in_tz

jobstores = {
    "default": RedisJobStore(host="redis", port=6379, password=REDIS_PASSWORD)
}

scheduler = AsyncIOScheduler(jobstores=jobstores)

async def get_scheduler():
    """
    To ensure that there is a running event loop before starting the scheduler
    """

    if scheduler.state == 0:
        scheduler.start()

    return scheduler

async def send_notification(
    chat_id: int,
    text: str,
    parse_mode: str | None = None
) -> None:

    msg = await send_msg(chat_id, text, parse_mode)
    
    if not msg:
        return
    
    scheduler = await get_scheduler()

    # Delete the message after a certain time
    scheduler.add_job(
        id=f"delete_msg_{chat_id}_{msg.message_id}",
        func=del_msg,
        trigger="date",
        run_date=(
            get_today_in_tz() + timedelta(seconds=NOTIFICATION_DELETE_SECONDS)
        ),
        args=[chat_id, msg.message_id]
    )
    
