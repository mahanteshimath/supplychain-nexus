from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.domain import GoldenTwin
from app.impact import calculate_supplier_impact
from app.simulation import Strategy, recommend_recovery, simulate_strategies

_ACTIONS = (
    {
        "action_type": "ACTIVATE_ALTERNATE_SUPPLIER",
        "title": "Activate Alternate Supplier Purchase Order",
        "description": "Issue a purchase order to qualified alternate capacity for the constrained materials.",
        "target_entity": "SUP-018",
        "estimated_cost": 185000,
        "document_ref": "PO-ALT-2026-0417",
    },
    {
        "action_type": "TRANSFER_INVENTORY",
        "title": "Transfer Internal Buffer Inventory",
        "description": "Move available buffer stock from unaffected plants to constrained assembly lines.",
        "target_entity": "PLANT-07",
        "estimated_cost": 0,
        "document_ref": "XFER-2026-0091",
    },
    {
        "action_type": "RESCHEDULE_PRODUCTION",
        "title": "Reprioritize Tier-1 Production Orders",
        "description": "Reschedule production sequencing so Tier-1 customer orders receive available capacity first.",
        "target_entity": "PLANT-03",
        "estimated_cost": 0,
        "document_ref": "MRP-2026-0512",
    },
)


@dataclass
class RecoveryWorkflow:
    twin: GoldenTwin
    supplier_id: str = "SUP-042"
    disruption_days: int = 14
    status: str = "PENDING_APPROVAL"
    approved_by: str | None = None
    audit_log: list[dict[str, object]] = field(default_factory=list)

    @property
    def impact(self) -> dict[str, object]:
        return calculate_supplier_impact(self.twin, self.supplier_id, self.disruption_days)

    @property
    def strategies(self) -> list[Strategy]:
        return simulate_strategies(self.impact)

    @property
    def recommendation(self) -> Strategy:
        return recommend_recovery(self.strategies)

    def plan(self) -> dict[str, object]:
        recommendation = self.recommendation
        impact = self.impact
        actions = [
            {
                "action_id": f"ACT-{index:02d}",
                "status": "COMPLETED" if self.status == "EXECUTED" else "PENDING",
                **action_def,
            }
            for index, action_def in enumerate(_ACTIONS, start=1)
        ]
        return {
            "plan_id": "REC-PLAN-2026-042",
            "event_id": "EVT-2026-042",
            "status": self.status,
            "approval_status": self.status,
            "approved_by": self.approved_by,
            "approved_by_user": self.approved_by,
            "supplier_id": self.supplier_id,
            "current_exposure": impact["revenue_at_risk"],
            "total_revenue_exposure": impact["revenue_at_risk"],
            "total_revenue_protected": recommendation["revenue_protected"],
            "total_additional_cost": recommendation["additional_cost"],
            "orders_protected": recommendation["orders_saved"],
            "orders_delayed": recommendation["orders_delayed"],
            "projected_delay_days": recommendation["delay_days"],
            "recommended_strategy": recommendation["strategy_name"],
            "executive_summary": (
                f"{self.supplier_id} disruption puts ${impact['revenue_at_risk']:,} at risk across "
                f"{impact['customer_orders_at_risk']} orders. Recommended strategy "
                f"{recommendation['strategy_name']} protects ${recommendation['revenue_protected']:,} "
                f"for an additional ${recommendation['additional_cost']:,}."
            ),
            "actions": actions,
        }

    def _log(
        self,
        *,
        action_title: str,
        action_type: str,
        requested_by_agent: str,
        user: str,
        role: str,
        approval_status: str,
        result_summary: str,
        document_reference: str,
    ) -> None:
        self.audit_log.append(
            {
                "log_id": f"LOG-{len(self.audit_log) + 1:04d}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action_title": action_title,
                "action_type": action_type,
                "requested_by_agent": requested_by_agent,
                "approved_by_user": user,
                "user_role": role,
                "approval_status": approval_status,
                "result_summary": result_summary,
                "document_reference": document_reference,
            }
        )

    def approve(self, user: str, role: str) -> dict[str, object]:
        if role not in {"EXECUTIVE", "SUPPLY_CHAIN_MANAGER", "PROCUREMENT_MANAGER"}:
            raise PermissionError(f"{role} cannot approve recovery plans")
        if self.status != "PENDING_APPROVAL":
            raise ValueError(f"Recovery plan cannot be approved from {self.status}")
        self.status = "EXECUTED"
        self.approved_by = user
        recommendation = self.recommendation
        for action in self.plan()["actions"]:
            self._log(
                action_title=action["title"],
                action_type=action["action_type"],
                requested_by_agent="Action Agent",
                user=user,
                role=role,
                approval_status="EXECUTED",
                result_summary=f"Executed via {recommendation['strategy_name']} strategy.",
                document_reference=action["document_ref"],
            )
        return self.plan()

    def reject(self, user: str) -> dict[str, object]:
        if self.status != "PENDING_APPROVAL":
            raise ValueError(f"Recovery plan cannot be rejected from {self.status}")
        self.status = "REJECTED"
        self.approved_by = user
        self._log(
            action_title="Recovery Plan Rejected",
            action_type="PLAN_REJECTION",
            requested_by_agent="Recovery Agent",
            user=user,
            role="N/A",
            approval_status="REJECTED",
            result_summary="Plan returned to orchestrator for re-simulation.",
            document_reference="N/A",
        )
        return self.plan()

    def dashboard(self) -> dict[str, object]:
        impact = self.impact
        mitigation = self.recommendation if self.status == "EXECUTED" else None
        revenue_at_risk = mitigation["revenue_at_risk"] if mitigation else impact["revenue_at_risk"]
        orders_at_risk = mitigation["orders_delayed"] if mitigation else impact["customer_orders_at_risk"]
        return {
            "supply_chain_health": 94 if mitigation else 72,
            "revenue_at_risk": revenue_at_risk,
            "orders_at_risk": orders_at_risk,
            "active_disruptions_count": 1,
            "plants_impacted_count": len(impact["affected_plants"]),
            "primary_disruption": {
                "event_id": "EVT-2026-042",
                "event_type": "SUPPLIER_DELAY",
                "entity_id": self.supplier_id,
                "duration_days": self.disruption_days,
                "severity": impact["severity"],
                "status": "MITIGATED" if mitigation else "INVESTIGATING",
            },
            "is_plan_approved": self.status == "EXECUTED",
        }