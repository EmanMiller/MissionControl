from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./missioncontrol.db"
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"


settings = Settings()
