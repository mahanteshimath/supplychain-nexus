import unittest

from app.domain import build_golden_twin
from app.impact import calculate_supplier_impact
from app.simulation import recommend_recovery, simulate_strategies


class SimulationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.impact = calculate_supplier_impact(build_golden_twin(), "SUP-042", 14)
        self.strategies = simulate_strategies(self.impact)

    def test_do_nothing_is_the_unmitigated_baseline(self) -> None:
        baseline = self.strategies[0]

        self.assertEqual(baseline["strategy_name"], "DO_NOTHING")
        self.assertEqual(baseline["revenue_protected"], 0)
        self.assertEqual(baseline["revenue_at_risk"], 4_200_000)

    def test_alternate_supplier_protects_more_revenue_than_other_options(self) -> None:
        alternate = next(strategy for strategy in self.strategies if strategy["strategy_name"] == "ALTERNATE_SUPPLIER")

        self.assertEqual(recommend_recovery(self.strategies), alternate)
        self.assertEqual(alternate["revenue_protected"], 3_990_000)
        self.assertEqual(alternate["orders_saved"], 121)