"""Single source for the active digital twin.

Snowflake backs the deployed app; the in-memory twin keeps tests and CI offline and
serves as the fallback if the warehouse is unreachable.
"""

from __future__ import annotations

from functools import lru_cache

from app.config import Settings, get_settings
from app.domain import GoldenTwin, build_golden_twin


def load_active_twin(settings: Settings | None = None) -> GoldenTwin:
    settings = settings or get_settings()
    if settings.data_backend != "snowflake":
        return build_golden_twin()
    try:
        from app.snowflake_repository import load_twin

        return load_twin(settings)
    except Exception as error:  # noqa: BLE001 - a warehouse outage must not break startup
        print(f"Snowflake twin unavailable, falling back to in-memory: {error}")
        return build_golden_twin()


@lru_cache(maxsize=1)
def active_twin() -> GoldenTwin:
    return load_active_twin()
