from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ml_api_url: str = "http://localhost:8000"
    ml_api_timeout_connect: int = 5
    ml_api_timeout_read: int = 10
    ml_api_retry_max: int = 3


settings = Settings()
