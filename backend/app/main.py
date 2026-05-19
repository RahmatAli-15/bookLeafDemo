from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.db.init_db import init_db
from app.utils.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Keep CORS resilient in Render where frontend URLs are dynamic.
allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
allowed_origin_regex = settings.cors_origin_regex.strip() or r"^https://.*\.onrender\.com$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("storage").mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")
app.include_router(router, prefix="/api")
