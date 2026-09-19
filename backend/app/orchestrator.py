"""Multi-agent orchestration across the four Foundry specialists.

The deterministic engine runs every calculation first; the specialists receive those
verified figures as context and only interpret them. Each step below is really executed,
so the trace the UI renders is a record of actual work rather than a script.
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from typing import Any

from app.impact import calculate_supplier_impact
from app.simulation import recommend_recovery, simulate_strategies
from app.twin import active_twin

_SCOPE = "https://ai.azure.com/.default"
_APPROVAL_THRESHOLD = int(os.getenv("APPROVAL_COST_THRESHOLD_USD", "250000"))

# Display name -> Foundry agent name.
SPECIALISTS = {
    "Impact Analyst": "nexus-impact-analyst",
    "Simulation Strategist": "nexus-simulation-strategist",
    "Recovery Planner": "nexus-recovery-planner",
    "Compliance Officer": "nexus-compliance-officer",
}


def _project_endpoint() -> str:
    endpoint = os.getenv("AZURE_AI_PROJECT_ENDPOINT") or os.getenv("FOUNDRY_PROJECT_ENDPOINT")
    if not endpoint:
        raise RuntimeError("Set AZURE_AI_PROJECT_ENDPOINT to reach the Foundry agents.")
    return endpoint.rstrip("/")


def _agent_client(agent_name: str):
    # The agent is selected by URL path, so `model` must be the underlying deployment.
    from azure.identity import DefaultAzureCredential
    from openai import OpenAI

    token = DefaultAzureCredential().get_token(_SCOPE).token
    base = f"{_project_endpoint()}/agents/{agent_name}/endpoint/protocols/openai"
    return OpenAI(base_url=base, api_key=token, default_query={"api-version": "v1"})


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _step(
    step_id: str,
    agent_name: str,
    tool_name: str,
    started: float,
    status: str,
    inputs: dict[str, Any],
    outputs: dict[str, Any],
    note: str,
) -> dict[str, Any]:
    return {
        "step_id": step_id,
        "agent_name": agent_name,
        "tool_name": tool_name,
        "timestamp": _now(),
        "duration_ms": round((time.perf_counter() - started) * 1000, 2),
        "status": status,
        "input_payload": inputs,
        "output_payload": outputs,
        "reasoning_note": note,
    }


def _ask(agent_name: str, facts: str) -> tuple[str, dict[str, Any]]:
    client = _agent_client(agent_name)
    response = client.responses.create(
        model=os.getenv("AZURE_AI_MODEL_DEPLOYMENT_NAME", "gpt-4.1-mini"),
        input=facts,
    )
    usage = getattr(response, "usage", None)
    meta = {
        "input_tokens": getattr(usage, "input_tokens", None),
        "output_tokens": getattr(usage, "output_tokens", None),
    }
    return response.output_text.strip(), meta


def run_orchestration(supplier_id: str = "SUP-042", disruption_days: int = 14) -> dict[str, Any]:
    """Run the full DETECT -> SIMULATE -> DECIDE -> GOVERN pipeline and record every step."""
    steps: list[dict[str, Any]] = []
    twin = active_twin()

    started = time.perf_counter()
    impact = calculate_supplier_impact(twin, supplier_id, disruption_days)
    steps.append(
        _step(
            "TRACE-001",
            "Orchestrator",
            "calculate_supplier_impact",
            started,
            "SUCCESS",
            {"supplier_id": supplier_id, "disruption_days": disruption_days},
            {
                "revenue_at_risk": impact["revenue_at_risk"],
                "customer_orders_at_risk": impact["customer_orders_at_risk"],
                "affected_plants": impact["affected_plants"],
                "inventory_coverage_days": impact["inventory_coverage_days"],
            },
            "Traversed supplier -> material -> product -> customer order against the live twin.",
        )
    )

    started = time.perf_counter()
    strategies = simulate_strategies(impact)
    recommendation = recommend_recovery(strategies)
    steps.append(
        _step(
            "TRACE-002",
            "Orchestrator",
            "simulate_strategies",
            started,
            "SUCCESS",
            {"disruption_days": disruption_days},
            {"strategy_count": len(strategies), "recommended": recommendation["strategy_name"]},
            "Scored every recovery strategy deterministically; no model involved.",
        )
    )

    facts = {
        "Impact Analyst": (
            "VERIFIED FACTS\n"
            f"supplier: {supplier_id} ({impact['supplier_name']})\n"
            f"disruption_days: {disruption_days}\n"
            f"revenue_at_risk: ${impact['revenue_at_risk']:,}\n"
            f"customer_orders_at_risk: {impact['customer_orders_at_risk']}\n"
            f"affected_plants: {', '.join(impact['affected_plants'])}\n"
            f"inventory_coverage_days: {impact['inventory_coverage_days']}\n"
            f"constrained_materials: {', '.join(m['material_id'] for m in impact['affected_materials'])}\n"
            f"tier_1_orders_delayed: {impact['sla_impact']['tier_1_orders_delayed']}\n\n"
            "Explain the impact."
        ),
        "Simulation Strategist": (
            "VERIFIED FACTS\nstrategies:\n"
            + "\n".join(
                f"- {s['strategy_name']}: protected=${s['revenue_protected']:,}, "
                f"cost=${s['additional_cost']:,}, delay={s['delay_days']}d, "
                f"sla_risk={s['customer_sla_risk']}, feasible={s['feasible']}"
                for s in strategies
            )
            + "\n\nCompare the trade-offs."
        ),
        "Recovery Planner": (
            "VERIFIED FACTS\n"
            f"recommended_strategy: {recommendation['strategy_name']}\n"
            f"revenue_protected: ${recommendation['revenue_protected']:,}\n"
            f"additional_cost: ${recommendation['additional_cost']:,}\n"
            f"net_benefit: ${recommendation['net_benefit']:,}\n"
            f"orders_saved: {recommendation['orders_saved']}\n"
            f"orders_delayed: {recommendation['orders_delayed']}\n"
            f"delay_days: {recommendation['delay_days']}\n"
            f"reasons: {'; '.join(recommendation['reasons'])}\n\n"
            "Justify the recommendation and list the actions required."
        ),
        "Compliance Officer": (
            "VERIFIED FACTS\n"
            f"recommended_strategy: {recommendation['strategy_name']}\n"
            f"additional_cost: ${recommendation['additional_cost']:,}\n"
            f"approval_threshold: ${_APPROVAL_THRESHOLD:,}\n"
            f"revenue_at_risk: ${impact['revenue_at_risk']:,}\n\n"
            "State the approval requirement and what must be audited."
        ),
    }

    narrative: dict[str, str] = {}
    for index, (display_name, agent_name) in enumerate(SPECIALISTS.items(), start=3):
        started = time.perf_counter()
        try:
            answer, meta = _ask(agent_name, facts[display_name])
            narrative[display_name] = answer
            steps.append(
                _step(
                    f"TRACE-{index:03d}",
                    display_name,
                    f"foundry:{agent_name}",
                    started,
                    "SUCCESS",
                    {"agent": agent_name, "facts": facts[display_name]},
                    {"response": answer, **meta},
                    "Foundry prompt agent reasoning over tool-verified figures only.",
                )
            )
        except Exception as error:  # noqa: BLE001 - a failed specialist must show in the trace
            steps.append(
                _step(
                    f"TRACE-{index:03d}",
                    display_name,
                    f"foundry:{agent_name}",
                    started,
                    "ERROR",
                    {"agent": agent_name},
                    {"error": str(error)},
                    "Specialist call failed; downstream steps continue with engine output.",
                )
            )

    return {
        "run_id": f"RUN-{int(time.time())}",
        "supplier_id": supplier_id,
        "disruption_days": disruption_days,
        "impact": impact,
        "strategies": strategies,
        "recommended_strategy": recommendation,
        "narrative": narrative,
        "approval_required": recommendation["additional_cost"] > _APPROVAL_THRESHOLD,
        "steps": steps,
    }
