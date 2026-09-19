"""Re-tunes the SUP-042 disruption scenario in NEXUS.CORE to a credible blast radius.

The seeded data spread the affected products evenly over all 15 plants with very large
order quantities, so a single Tier-1 supplier appeared to put >$300M and every plant at
risk. This concentrates the scenario into 3 plants and 127 orders and rebuilds revenue
from real unit prices. Deterministic and idempotent: re-running yields the same state.
"""

from __future__ import annotations

import sys

import snowflake.connector

from app.config import get_settings
from app.snowflake_connection import connection_parameters

TARGET_SUPPLIER = "SUP-042"
TARGET_ORDERS = 127
TARGET_PLANTS = ("PLANT-03", "PLANT-07", "PLANT-11")

_AFFECTED_PRODUCTS = """
SELECT DISTINCT b.PRODUCT_ID
FROM NEXUS.CORE.BOM b
JOIN NEXUS.CORE.MATERIAL m ON m.MATERIAL_ID = b.COMPONENT_ITEM_ID
WHERE m.PRIMARY_SUPPLIER_ID = %(supplier)s
"""

_IMPACT = f"""
SELECT COUNT(DISTINCT co.CUSTOMER_ORDER_ID),
       COALESCE(SUM(col.REVENUE), 0),
       COUNT(DISTINCT co.PLANT_ID)
FROM NEXUS.CORE.CUSTOMER_ORDER_LINE col
JOIN NEXUS.CORE.CUSTOMER_ORDER co ON co.CUSTOMER_ORDER_ID = col.CUSTOMER_ORDER_ID
WHERE col.PRODUCT_ID IN ({_AFFECTED_PRODUCTS})
"""


def _impact(cursor) -> tuple:
    cursor.execute(_IMPACT, {"supplier": TARGET_SUPPLIER})
    orders, revenue, plants = cursor.fetchone()
    return int(orders), float(revenue), int(plants)


def _retune(cursor) -> None:
    cursor.execute(
        f"""
        CREATE OR REPLACE TEMPORARY TABLE SCENARIO_RANK AS
        SELECT CUSTOMER_ORDER_ID,
               ROW_NUMBER() OVER (ORDER BY CUSTOMER_ORDER_ID) AS RN
        FROM (
            SELECT DISTINCT co.CUSTOMER_ORDER_ID
            FROM NEXUS.CORE.CUSTOMER_ORDER co
            JOIN NEXUS.CORE.CUSTOMER_ORDER_LINE col
              ON col.CUSTOMER_ORDER_ID = co.CUSTOMER_ORDER_ID
            WHERE col.PRODUCT_ID IN ({_AFFECTED_PRODUCTS})
        )
        """,
        {"supplier": TARGET_SUPPLIER},
    )

    cursor.execute(
        f"""
        CREATE OR REPLACE TEMPORARY TABLE SCENARIO_PRODUCTS AS
        {_AFFECTED_PRODUCTS}
        """,
        {"supplier": TARGET_SUPPLIER},
    )

    # A stand-in product for orders leaving the scenario; must not trace back to SUP-042.
    cursor.execute(
        """
        SELECT PRODUCT_ID, UNIT_PRICE FROM NEXUS.CORE.PRODUCT
        WHERE PRODUCT_ID NOT IN (SELECT PRODUCT_ID FROM SCENARIO_PRODUCTS)
        ORDER BY PRODUCT_ID LIMIT 1
        """
    )
    filler_id, filler_price = cursor.fetchone()

    # Retained orders move onto the three scenario plants.
    cursor.execute(
        """
        UPDATE NEXUS.CORE.CUSTOMER_ORDER co
        SET PLANT_ID = CASE MOD(r.RN, 3)
                           WHEN 0 THEN %(p0)s
                           WHEN 1 THEN %(p1)s
                           ELSE %(p2)s
                       END
        FROM SCENARIO_RANK r
        WHERE co.CUSTOMER_ORDER_ID = r.CUSTOMER_ORDER_ID AND r.RN <= %(keep)s
        """,
        {"p0": TARGET_PLANTS[0], "p1": TARGET_PLANTS[1], "p2": TARGET_PLANTS[2], "keep": TARGET_ORDERS},
    )

    # Rebuild quantity and revenue from the real unit price instead of bulk quantities.
    cursor.execute(
        """
        UPDATE NEXUS.CORE.CUSTOMER_ORDER_LINE col
        SET QUANTITY = 1 + MOD(r.RN, 3),
            REVENUE  = (1 + MOD(r.RN, 3)) * col.UNIT_PRICE
        FROM SCENARIO_RANK r
        WHERE col.CUSTOMER_ORDER_ID = r.CUSTOMER_ORDER_ID
          AND r.RN <= %(keep)s
          AND col.PRODUCT_ID IN (SELECT PRODUCT_ID FROM SCENARIO_PRODUCTS)
        """,
        {"keep": TARGET_ORDERS},
    )

    # Surplus orders are re-pointed off the scenario products entirely.
    cursor.execute(
        """
        UPDATE NEXUS.CORE.CUSTOMER_ORDER_LINE col
        SET PRODUCT_ID = %(filler)s,
            UNIT_PRICE = %(price)s,
            REVENUE    = col.QUANTITY * %(price)s
        FROM SCENARIO_RANK r
        WHERE col.CUSTOMER_ORDER_ID = r.CUSTOMER_ORDER_ID
          AND r.RN > %(keep)s
          AND col.PRODUCT_ID IN (SELECT PRODUCT_ID FROM SCENARIO_PRODUCTS)
        """,
        {"filler": filler_id, "price": filler_price, "keep": TARGET_ORDERS},
    )

    # Order header totals must agree with their lines.
    cursor.execute(
        """
        UPDATE NEXUS.CORE.CUSTOMER_ORDER co
        SET TOTAL_REVENUE = s.REV
        FROM (
            SELECT CUSTOMER_ORDER_ID, SUM(REVENUE) AS REV
            FROM NEXUS.CORE.CUSTOMER_ORDER_LINE GROUP BY CUSTOMER_ORDER_ID
        ) s
        WHERE co.CUSTOMER_ORDER_ID = s.CUSTOMER_ORDER_ID
        """
    )


def main() -> int:
    with snowflake.connector.connect(**connection_parameters(get_settings())) as connection:
        with connection.cursor() as cursor:
            before = _impact(cursor)
            print(f"before: orders={before[0]} revenue=${before[1]:,.2f} plants={before[2]}")
            _retune(cursor)
            connection.commit()
            after = _impact(cursor)
            print(f"after:  orders={after[0]} revenue=${after[1]:,.2f} plants={after[2]}")

    if after[0] != TARGET_ORDERS or after[2] != len(TARGET_PLANTS):
        print(f"FAILED: expected {TARGET_ORDERS} orders across {len(TARGET_PLANTS)} plants")
        return 1
    print("Scenario re-tuned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
