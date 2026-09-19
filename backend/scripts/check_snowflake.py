import snowflake.connector

from app.config import get_settings
from app.snowflake_connection import connection_parameters


def main() -> None:
    with snowflake.connector.connect(**connection_parameters(get_settings())) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT CURRENT_ACCOUNT(), CURRENT_USER(), CURRENT_ROLE(), CURRENT_WAREHOUSE(), "
                "CURRENT_DATABASE(), CURRENT_SCHEMA()"
            )
            print(" | ".join(str(value) for value in cursor.fetchone()))


if __name__ == "__main__":
    main()