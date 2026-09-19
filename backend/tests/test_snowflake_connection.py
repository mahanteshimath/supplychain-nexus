import unittest

from pydantic import SecretStr

from app.config import Settings
from app.snowflake_connection import connection_parameters


class SnowflakeConnectionTests(unittest.TestCase):
    def test_connection_parameters_unwrap_the_secret_only_for_the_driver(self) -> None:
        settings = Settings(
            snowflake_account="ACCOUNT",
            snowflake_user="USER",
            snowflake_password=SecretStr("secret"),
        )

        parameters = connection_parameters(settings)

        self.assertEqual(parameters["password"], "secret")
        self.assertEqual(parameters["login_timeout"], 15)