from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "TinniCare API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_DB_URL: str = ""

    GROQ_API_KEY: str
    LANGCHAIN_VERBOSE: bool = False

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: Optional[str] = None

    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    APPLE_CLIENT_ID: Optional[str] = None

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def active_db_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.SUPABASE_DB_URL:
            return self.SUPABASE_DB_URL
        return "sqlite:///./tinnicare.db"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
