from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SUPPLYCHAIN NEXUS"
    app_env: str = "development"
    frontend_origin: str = "http://localhost:5173"
    data_backend: str = "snowflake"
    data_profile: str = "golden"
    data_seed: int = 42
    snowflake_account: str | None = None
    snowflake_user: str | None = None
    snowflake_password: SecretStr | None = None
    snowflake_role: str = "ACCOUNTADMIN"
    snowflake_warehouse: str = "COMPUTE_WH"
    snowflake_database: str = "DB"
    snowflake_schema: str = "SCH"
    azure_subscription_id: str | None = None
    azure_location: str = "eastus2"
    azure_ai_project_endpoint: str | None = None
    azure_ai_model_deployment_name: str | None = None
    approval_cost_threshold_usd: int = Field(default=250000, ge=0)


@lru_cache
def get_settings() -> Settings:
    return Settings()