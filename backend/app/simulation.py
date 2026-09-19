from typing import TypedDict


class Strategy(TypedDict):
    strategy_id: str
    strategy_name: str
    revenue_protected: int
    revenue_at_risk: int
    additional_cost: int
    net_benefit: int
    delay_days: float
    orders_saved: int
    orders_delayed: int
    customer_sla_risk: float
    feasible: bool
    reasons: list[str]


_STRATEGY_PARAMETERS = (
    ("DO_NOTHING", 0.0, 0, 1.0, 0.89, "No intervention before supplier recovery."),
    ("EXPEDITE", 0.70, 280000, 5 / 14, 0.28, "Contracted expedite reduces the inbound delay to five days."),
    ("REALLOCATE_INVENTORY", 0.57, 145000, 6 / 14, 0.35, "Available internal buffer is transferred to constrained plants."),
    ("ALTERNATE_SUPPLIER", 0.95, 185000, 2 / 14, 0.08, "Qualified alternate capacity is available within three days."),
    ("RESCHEDULE_PRODUCTION", 0.50, 40000, 7 / 14, 0.42, "Tier-1 orders receive available capacity before lower-priority work."),
)


def simulate_strategies(impact: dict[str, object]) -> list[Strategy]:
    exposure = int(impact["revenue_at_risk"])
    orders = int(impact["customer_orders_at_risk"])
    disruption_days = int(impact["disruption_duration_days"])
    coverage_days = float(impact["inventory_coverage_days"])
    strategies: list[Strategy] = []
    for index, (name, protection_rate, cost, delay_fraction, sla_risk, reason) in enumerate(
        _STRATEGY_PARAMETERS, start=1
    ):
        protected = round(exposure * protection_rate)
        saved = round(orders * protection_rate)
        strategies.append(
            {
                "strategy_id": f"STRAT-{index:02d}",
                "strategy_name": name,
                "revenue_protected": protected,
                "revenue_at_risk": exposure - protected,
                "additional_cost": cost,
                "net_benefit": protected - cost,
                "delay_days": round(disruption_days * delay_fraction, 1),
                "orders_saved": saved,
                "orders_delayed": orders - saved,
                "customer_sla_risk": sla_risk if exposure else 0.0,
                "feasible": name != "ALTERNATE_SUPPLIER" or coverage_days < disruption_days,
                "reasons": [
                    f"Existing inventory covers {coverage_days} days.",
                    reason,
                ],
            }
        )
    return strategies


def recommend_recovery(strategies: list[Strategy]) -> Strategy:
    feasible = [strategy for strategy in strategies if strategy["feasible"]]
    return max(feasible, key=lambda strategy: (strategy["net_benefit"], -strategy["customer_sla_risk"]))