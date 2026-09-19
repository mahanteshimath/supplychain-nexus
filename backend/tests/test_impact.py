import unittest

from app.domain import build_golden_twin
from app.impact import calculate_supplier_impact


class SupplierImpactTests(unittest.TestCase):
    def test_sup_042_cascades_to_real_downstream_orders(self) -> None:
        impact = calculate_supplier_impact(build_golden_twin(), "SUP-042", 14)

        self.assertEqual(impact["customer_orders_at_risk"], 127)
        self.assertEqual(impact["revenue_at_risk"], 4_200_000)
        self.assertEqual(impact["affected_plants"], ["PLANT-03", "PLANT-07", "PLANT-11"])
        self.assertEqual(impact["inventory_coverage_days"], 5.2)

    def test_disruption_within_inventory_coverage_has_no_order_exposure(self) -> None:
        impact = calculate_supplier_impact(build_golden_twin(), "SUP-042", 5)

        self.assertEqual(impact["customer_orders_at_risk"], 0)
        self.assertEqual(impact["revenue_at_risk"], 0)