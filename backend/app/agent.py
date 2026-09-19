"""Foundry Responses-protocol adapter over the deterministic supply-chain twin.

The model never computes figures itself: every number it reports comes from a tool
call into the deterministic impact/simulation engine.
"""

import json
import os
from typing import Any

from app.impact import calculate_supplier_impact
from app.simulation import recommend_recovery, simulate_strategies
from app.twin import active_twin

_SCOPES = (
    "https://ai.azure.com/.default",
    "https://cognitiveservices.azure.com/.default",
)
_MAX_TOOL_TURNS = 6

INSTRUCTIONS = (
    "You are the SUPPLYCHAIN NEXUS resilience analyst for Nexora Manufacturing. "
    "Always call the provided tools for any figure you report; never estimate numbers yourself. "
    "Report the quantified impact, the recommended recovery strategy, and its trade-offs. "
    "If the user does not give a disruption duration, use 14 days."
)

TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "get_supplier_impact",
        "description": (
            "Quantify revenue at risk, customer orders at risk, affected plants and "
            "inventory coverage for a supplier disruption."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "supplier_id": {"type": "string", "description": "Supplier identifier, e.g. SUP-042."},
                "disruption_days": {"type": "integer", "description": "Disruption duration in days."},
            },
            "required": ["supplier_id", "disruption_days"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "compare_recovery_strategies",
        "description": (
            "Simulate every recovery strategy for a supplier disruption and return them "
            "alongside the recommended strategy."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "supplier_id": {"type": "string", "description": "Supplier identifier, e.g. SUP-042."},
                "disruption_days": {"type": "integer", "description": "Disruption duration in days."},
            },
            "required": ["supplier_id", "disruption_days"],
            "additionalProperties": False,
        },
    },
]


def _get_supplier_impact(supplier_id: str, disruption_days: int) -> dict[str, Any]:
    impact = calculate_supplier_impact(active_twin(), supplier_id, disruption_days)
    # Trim the row-level detail: the model only needs the decision-relevant totals.
    return {
        key: impact[key]
        for key in (
            "supplier_id",
            "supplier_name",
            "disruption_duration_days",
            "severity",
            "revenue_at_risk",
            "margin_at_risk",
            "customer_orders_at_risk",
            "affected_plants",
            "inventory_coverage_days",
            "lead_time_gap_days",
            "sla_impact",
        )
    }


def _compare_recovery_strategies(supplier_id: str, disruption_days: int) -> dict[str, Any]:
    impact = calculate_supplier_impact(active_twin(), supplier_id, disruption_days)
    strategies = simulate_strategies(impact)
    return {
        "strategies": strategies,
        "recommended_strategy": recommend_recovery(strategies),
    }


_DISPATCH = {
    "get_supplier_impact": _get_supplier_impact,
    "compare_recovery_strategies": _compare_recovery_strategies,
}


def _base_url() -> str:
    project = os.getenv("AZURE_AI_PROJECT_ENDPOINT") or os.getenv("FOUNDRY_PROJECT_ENDPOINT")
    if not project:
        raise RuntimeError("Set AZURE_AI_PROJECT_ENDPOINT or FOUNDRY_PROJECT_ENDPOINT.")
    account = project.split("/api/projects/")[0].rstrip("/")
    # The v1 route uses implicit versioning, so no api-version is passed.
    return f"{account}/openai/v1"


def _client(scope: str):
    from azure.identity import DefaultAzureCredential
    from openai import OpenAI

    token = DefaultAzureCredential().get_token(scope).token
    return OpenAI(base_url=_base_url(), api_key=token)


def _model() -> str:
    return os.getenv("AZURE_AI_MODEL_DEPLOYMENT_NAME", "gpt-4.1-mini")


def run_responses(payload: dict[str, Any]) -> dict[str, Any]:
    """Execute one Responses turn, resolving tool calls against the deterministic engine."""
    from openai import AuthenticationError

    last_error: Exception | None = None
    for scope in _SCOPES:
        try:
            return _run(payload, _client(scope))
        except AuthenticationError as error:
            last_error = error
    raise RuntimeError(f"Model authentication failed for all scopes: {last_error}")


def _run(payload: dict[str, Any], client) -> dict[str, Any]:
    conversation: Any = payload.get("input", "")
    model = _model()

    for _ in range(_MAX_TOOL_TURNS):
        response = client.responses.create(
            model=model,
            input=conversation,
            instructions=payload.get("instructions") or INSTRUCTIONS,
            tools=TOOLS,
        )
        calls = [item for item in response.output if item.type == "function_call"]
        if not calls:
            return response.model_dump()

        conversation = response.output + [
            {
                "type": "function_call_output",
                "call_id": call.call_id,
                "output": json.dumps(
                    _DISPATCH[call.name](**json.loads(call.arguments)), default=str
                ),
            }
            for call in calls
        ]

    raise RuntimeError(f"Tool resolution did not converge within {_MAX_TOOL_TURNS} turns.")


def extract_output_text(response: dict[str, Any]) -> str:
    """Pull the assistant's text out of a Responses payload."""
    parts = [
        content.get("text", "")
        for item in response.get("output", [])
        if item.get("type") == "message"
        for content in item.get("content", [])
        if content.get("type") == "output_text"
    ]
    return "\n".join(parts).strip()
