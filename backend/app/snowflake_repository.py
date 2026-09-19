"""Reads the live NEXUS.CORE digital twin from Snowflake.

Maps the warehouse schema onto the same dataclasses the deterministic engine already
uses, so impact.py and simulation.py work unchanged against either data source.
Inventory lives in its own table and consumption is derived from production orders,
so coverage days are computed here rather than read from a column.
"""

from __future__ import annotations

from functools import lru_cache

import snowflake.connector

from app.config import Settings, get_settings
from app.domain import Component, CustomerOrder, GoldenTwin, Material, Product
from app.snowflake_connection import connection_parameters

_SUPPLIERS = """
SELECT SUPPLIER_ID, SUPPLIER_NAME FROM NEXUS.CORE.SUPPLIER WHERE ACTIVE_FLAG = TRUE
"""

# Consumption comes from booked production demand; fall back to a safety-stock proxy
# so a material is never treated as having infinite runway.
_MATERIALS = """
SELECT m.MATERIAL_ID,
       m.PRIMARY_SUPPLIER_ID,
       COALESCE(inv.AVAILABLE_QTY, 0)                         AS AVAILABLE_QTY,
       COALESCE(NULLIF(cons.DAILY, 0), m.SAFETY_STOCK / 30.0, 1) AS DAILY_CONSUMPTION,
       m.CRITICALITY
FROM NEXUS.CORE.MATERIAL m
LEFT JOIN (
    SELECT MATERIAL_ID, SUM(AVAILABLE_QTY) AS AVAILABLE_QTY
    FROM NEXUS.CORE.INVENTORY GROUP BY MATERIAL_ID
) inv ON inv.MATERIAL_ID = m.MATERIAL_ID
LEFT JOIN (
    SELECT MATERIAL_ID, SUM(REQUIRED_QTY) / 30.0 AS DAILY
    FROM NEXUS.CORE.PRODUCTION_CONSUMPTION GROUP BY MATERIAL_ID
) cons ON cons.MATERIAL_ID = m.MATERIAL_ID
"""

# The warehouse BOM links products straight to material ids, so each link is surfaced
# as a synthetic component to preserve the supplier -> material -> product traversal.
_COMPONENTS = """
SELECT DISTINCT b.COMPONENT_ITEM_ID, b.COMPONENT_ITEM_ID AS MATERIAL_ID
FROM NEXUS.CORE.BOM b
JOIN NEXUS.CORE.MATERIAL m ON m.MATERIAL_ID = b.COMPONENT_ITEM_ID
"""

_PRODUCTS = """
SELECT b.PRODUCT_ID, ARRAY_AGG(DISTINCT b.COMPONENT_ITEM_ID) AS COMPONENT_IDS
FROM NEXUS.CORE.BOM b
JOIN NEXUS.CORE.MATERIAL m ON m.MATERIAL_ID = b.COMPONENT_ITEM_ID
GROUP BY b.PRODUCT_ID
"""

_ORDERS = """
SELECT col.CUSTOMER_ORDER_ID,
       col.PRODUCT_ID,
       co.PLANT_ID,
       col.REVENUE,
       COALESCE(c.CUSTOMER_TIER, 'TIER_3') AS CUSTOMER_TIER
FROM NEXUS.CORE.CUSTOMER_ORDER_LINE col
JOIN NEXUS.CORE.CUSTOMER_ORDER co ON co.CUSTOMER_ORDER_ID = col.CUSTOMER_ORDER_ID
LEFT JOIN NEXUS.CORE.CUSTOMER c ON c.CUSTOMER_ID = co.CUSTOMER_ID
"""


def _tier(raw: object) -> int:
    """CUSTOMER_TIER arrives as either a number or a label such as 'TIER_1'."""
    text = str(raw).upper()
    for value in (1, 2, 3):
        if text.endswith(str(value)):
            return value
    return 3


def _connect(settings: Settings):
    return snowflake.connector.connect(**connection_parameters(settings))


def load_twin(settings: Settings | None = None) -> GoldenTwin:
    settings = settings or get_settings()
    with _connect(settings) as connection:
        with connection.cursor() as cursor:
            cursor.execute(_SUPPLIERS)
            suppliers = {str(row[0]): str(row[1]) for row in cursor.fetchall()}

            cursor.execute(_MATERIALS)
            materials = tuple(
                Material(
                    material_id=str(row[0]),
                    supplier_id=str(row[1]),
                    available_qty=float(row[2]),
                    daily_consumption=float(row[3]),
                    criticality=str(row[4] or "MEDIUM"),
                )
                for row in cursor.fetchall()
            )

            cursor.execute(_COMPONENTS)
            components = tuple(
                Component(component_id=str(row[0]), material_id=str(row[1]))
                for row in cursor.fetchall()
            )

            cursor.execute(_PRODUCTS)
            products = tuple(
                Product(
                    product_id=str(row[0]),
                    component_ids=tuple(str(c) for c in _as_list(row[1])),
                )
                for row in cursor.fetchall()
            )

            cursor.execute(_ORDERS)
            orders = tuple(
                CustomerOrder(
                    order_id=str(row[0]),
                    product_id=str(row[1]),
                    plant_id=str(row[2]),
                    revenue=int(float(row[3] or 0)),
                    customer_tier=_tier(row[4]),
                )
                for row in cursor.fetchall()
            )

    return GoldenTwin(suppliers, materials, components, products, orders)


def _as_list(value: object) -> list:
    """ARRAY_AGG returns a JSON string through the connector."""
    if isinstance(value, list):
        return value
    import json

    return json.loads(value) if value else []


@lru_cache(maxsize=1)
def cached_twin() -> GoldenTwin:
    return load_twin()


# Digital Twin explorer: entity key -> warehouse table.
ENTITY_TABLES = {
    "suppliers": "SUPPLIER",
    "materials": "MATERIAL",
    "boms": "BOM",
    "products": "PRODUCT",
    "plants": "PLANT",
    "customers": "CUSTOMER",
    "purchase_orders": "PURCHASE_ORDER",
    "customer_orders": "CUSTOMER_ORDER",
    "contracts": "SUPPLIER_CONTRACT",
}


def list_entity(entity: str, limit: int = 500, settings: Settings | None = None) -> list[dict]:
    """Return rows for one digital-twin entity, newest-agnostic and row-capped for the UI."""
    table = ENTITY_TABLES.get(entity)
    if table is None:
        return []
    settings = settings or get_settings()
    with _connect(settings) as connection:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT * FROM NEXUS.CORE.{table} LIMIT {int(limit)}")
            columns = [column[0].lower() for column in cursor.description]
            return [dict(zip(columns, _jsonable(row))) for row in cursor.fetchall()]


def _jsonable(row: tuple) -> list:
    from datetime import date, datetime
    from decimal import Decimal

    values = []
    for value in row:
        if isinstance(value, Decimal):
            values.append(float(value))
        elif isinstance(value, (date, datetime)):
            values.append(value.isoformat())
        else:
            values.append(value)
    return values
