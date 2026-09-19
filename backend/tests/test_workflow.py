import unittest

from app.domain import build_golden_twin
from app.workflow import RecoveryWorkflow


class RecoveryWorkflowTests(unittest.TestCase):
    def test_manager_approval_executes_actions_and_recalculates_kpis(self) -> None:
        workflow = RecoveryWorkflow(build_golden_twin())

        before = workflow.dashboard()
        plan = workflow.approve("Monty", "SUPPLY_CHAIN_MANAGER")
        after = workflow.dashboard()

        self.assertEqual(plan["status"], "EXECUTED")
        self.assertEqual(before["revenue_at_risk"], 4_200_000)
        self.assertEqual(after["revenue_at_risk"], 210_000)
        self.assertEqual(after["orders_at_risk"], 6)
        self.assertEqual(len(workflow.audit_log), 3)

    def test_planner_cannot_approve(self) -> None:
        workflow = RecoveryWorkflow(build_golden_twin())

        with self.assertRaises(PermissionError):
            workflow.approve("Monty", "PLANNER")