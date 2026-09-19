from typing import Any

from app.config import Settings


def connection_parameters(settings: Settings) -> dict[str, Any]:
    if not settings.snowflake_account or not settings.snowflake_user or not settings.snowflake_password:
        raise ValueError("Snowflake account, user, and password must be configured")
    return {
        "account": settings.snowflake_account,
        "user": settings.snowflake_user,
        "password": settings.snowflake_password.get_secret_value(),
        "role": settings.snowflake_role,
        "warehouse": settings.snowflake_warehouse,
        "database": settings.snowflake_database,
        "schema": settings.snowflake_schema,
        "login_timeout": 15,
        "network_timeout": 15,
    }