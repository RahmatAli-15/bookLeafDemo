from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BookAI API"
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bookai"
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = "./storage/uploads"
    audio_dir: str = "./storage/audio"
    chunk_size: int = 800
    chunk_overlap: int = 120
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

# Render often provides postgres:// URLs; SQLAlchemy asyncpg expects postgresql+asyncpg://
if settings.database_url.startswith("postgres://"):
    settings.database_url = settings.database_url.replace(
        "postgres://", "postgresql+asyncpg://", 1
    )
elif settings.database_url.startswith("postgresql://"):
    settings.database_url = settings.database_url.replace(
        "postgresql://", "postgresql+asyncpg://", 1
    )
