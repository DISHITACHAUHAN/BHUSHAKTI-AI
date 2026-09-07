import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "BHUSHAKTI AI API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5174"
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    return [i.strip() for i in v.strip("[]").split(",") if i.strip()]
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bhushakti.db")

    # Generative AI (Gemini Decision Support)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Simulator
    WEATHER_UPDATE_INTERVAL_SECONDS: int = 10
    SIMULATION_MODE: bool = True

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
