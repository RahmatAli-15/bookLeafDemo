from app.db.base import Base
from app.db.models import *  # noqa: F403,F401
from app.db.session import engine


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
