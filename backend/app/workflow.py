from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.domain import GoldenTwin
from app.impact import calculate_supplier_impact
from app.simulation import Strategy, recommend_recovery, simulate_strategies


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
        return {
            "plan_id": "REC-PLAN-2026-042",
            "event_id": "EVT-2026-042",
            "status": self.status,
            "approved_by": self.approved_by,
            "supplier_id": self.supplier_id,
            "current_exposure": self.impact["revenue_at_risk"],
            "recommended_strategy": recommendation,
            "actions": [
                "Create alternate supplier purchase order",
                "Transfer internal buffer inventory",
                "Prioritize Tier-1 customer orders",
            ],
        }

    def approve(self, user: str, role: str) -> dict[str, object]:
        if role not in {"EXECUTIVE", "SUPPLY_CHAIN_MANAGER", "PROCUREMENT_MANAGER"}:
            raise PermissionError(f"{role} cannot approve recovery plans")
        if self.status != "PENDING_APPROVAL":
            raise ValueError(f"Recovery plan cannot be approved from {self.status}")
        self.status = "EXECUTED"
        self.approved_by = user
        recommendation = self.recommendation
        timestamp = datetime.now(timezone.utc).isoformat()
        for action in self.plan()["actions"]:
            self.audit_log.append(
                {
                    "timestamp": timestamp,
                    "action": action,
                    "agent": "Action Agent",
                    "user": user,
                    "role": role,
                    "approval": "APPROVED",
                    "execution": "EXECUTED",
                    "result": recommendation["strategy_name"],
                }
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