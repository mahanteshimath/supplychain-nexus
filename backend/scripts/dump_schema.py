"""Dumps CREATE TABLE DDL for every table in NEXUS.CORE into one SQL file.

Usage: python -m scripts.dump_schema [output_path]
"""

import sys
from pathlib import Path

import snowflake.connector

from app.config import get_settings
from app.snowflake_connection import connection_parameters

DATABASE = "NEXUS"
SCHEMA = "CORE"


def main() -> None:
    output_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("snowflake/ddl/nexus_core_schema.sql")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with snowflake.connector.connect(**connection_parameters(get_settings())) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"SELECT TABLE_NAME FROM {DATABASE}.INFORMATION_SCHEMA.TABLES "
                f"WHERE TABLE_SCHEMA = '{SCHEMA}' AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
            )
            tables = [row[0] for row in cursor.fetchall()]

            statements = []
            for table in tables:
                cursor.execute(f"SELECT GET_DDL('TABLE', '{DATABASE}.{SCHEMA}.{table}')")
                statements.append(cursor.fetchone()[0])

    output_path.write_text(
        f"-- {DATABASE}.{SCHEMA} table definitions ({len(tables)} tables)\n\n"
        + "\n\n".join(statement.rstrip(";") + ";" for statement in statements),
        encoding="utf-8",
    )
    print(f"Wrote {len(tables)} table definitions to {output_path}")


if __name__ == "__main__":
    main()
