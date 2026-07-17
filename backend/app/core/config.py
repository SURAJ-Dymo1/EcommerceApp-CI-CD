from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "NexShop E-Commerce API"
    API_V1_STR: str = "/api"
    
    # MongoDB configuration
    MONGODB_URL: str = "mongodb://admin:adminpassword@mongodb-headless:27017"
    DATABASE_NAME: str = "ecommerce"
    
    # JWT security settings
    JWT_SECRET: str = "SUPER_SECRET_KEY_FOR_JWT_SIGNING_1234567890!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
