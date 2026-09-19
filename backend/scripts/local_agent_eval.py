"""Domain-grounded local evaluation for the SupplyChain Nexus Foundry agents.

Replaces the mismatched AIME-2025 math benchmark: runs the real orchestration across
all 5 disruption scenarios and judges each specialist's narrative against the exact
deterministic facts it was given (never free-form math). Also checks the hosted
agent's tool-grounded answers for figure fabrication.

Usage: python scripts/local_agent_eval.py   (run from backend/)
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from openai import RateLimitError

from app.agent import _SCOPES, _client as _judge_client, _model, extract_output_text, run_responses
from app.impact import calculate_supplier_impact
from app.orchestrator import _APPROVAL_THRESHOLD, run_orchestration
from app.twin import active_twin

# Trimmed and paced: the shared gpt-4.1-mini deployment has only 10 capacity units.
SCENARIOS = [
    ("SUP-042", 14),
    ("SUP-078", 10),
    ("SUP-097", 20),
]
_CALL_DELAY_SECONDS = 4

_RUBRICS = {
    "Impact Analyst": (
        "Must lead with revenue at risk, affected customer orders, and inventory runway, "
        "and name constrained materials/plants, using ONLY numbers present in FACTS."
    ),
    "Simulation Strategist": (
        "Must compare cost vs. protection trade-offs across strategies using ONLY the "
        "numbers in FACTS, and must NOT recommend a winning strategy."
    ),
    "Recovery Planner": (
        "Must justify the recommended strategy's net benefit, note a risk, and list "
        "concrete actions, using ONLY the numbers in FACTS."
    ),
    "Compliance Officer": (
        "Must state plainly whether approval is required (cost vs. threshold) and which "
        "role must approve, using ONLY the numbers in FACTS."
    ),
}

_FACTS_BY_ROLE = {
    "Impact Analyst": lambda run: run["impact"],
    "Simulation Strategist": lambda run: run["strategies"],
    "Recovery Planner": lambda run: run["recommended_strategy"],
    "Compliance Officer": lambda run: {
        "recommended_strategy": run["recommended_strategy"]["strategy_name"],
        "additional_cost": run["recommended_strategy"]["additional_cost"],
        "revenue_at_risk": run["impact"]["revenue_at_risk"],
        "approval_threshold": _APPROVAL_THRESHOLD,
        "approval_required": run["approval_required"],
    },
}


def _judge(role: str, facts: object, response: str) -> dict:
    client = _judge_client(_SCOPES[0])
    prompt = (
        "You are grading an AI supply-chain specialist's response.\n"
        f"ROLE RUBRIC: {_RUBRICS[role]}\n\n"
        f"FACTS (the only numbers the agent may use):\n{json.dumps(facts, default=str)}\n\n"
        f"AGENT RESPONSE:\n{response}\n\n"
        "Does the response satisfy the rubric and avoid fabricating any number absent from FACTS? "
        'Return strict JSON only: {"result": "pass" or "fail", "reason": "<one sentence>"}'
    )
    for attempt in range(4):
        try:
            judged = client.responses.create(model=_model(), input=prompt)
            break
        except RateLimitError:
            time.sleep(5 * (attempt + 1))
    else:
        return {"result": "unknown", "reason": "Rate-limited after retries."}
    text = judged.output_text.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"result": "unknown", "reason": text}


def eval_specialists() -> list[dict]:
    rows = []
    for supplier_id, disruption_days in SCENARIOS:
        run = run_orchestration(supplier_id, disruption_days)
        for role, response in run["narrative"].items():
            facts = _FACTS_BY_ROLE[role](run)
            verdict = _judge(role, facts, response)
            rows.append(
                {
                    "scenario": f"{supplier_id}/{disruption_days}d",
                    "role": role,
                    "response": response,
                    **verdict,
                }
            )
            time.sleep(_CALL_DELAY_SECONDS)
    return rows


def eval_hosted_agent() -> list[dict]:
    # (query, supplier_id, disruption_days) so we can verify the answer against the
    # deterministic engine's own numbers — run_responses resolves tool calls internally,
    # so the returned response never shows the intermediate function_call turns.
    cases = [
        ("What's the impact of a 14-day disruption at SUP-042, and what recovery strategy do you recommend?", "SUP-042", 14),
        ("Compare recovery strategies for a 10-day disruption at SUP-078.", "SUP-078", 10),
    ]
    rows = []
    for query, supplier_id, disruption_days in cases:
        impact = calculate_supplier_impact(active_twin(), supplier_id, disruption_days)
        response = run_responses({"input": query})
        text = extract_output_text(response)
        grounded = f"{impact['revenue_at_risk']:,}" in text
        rows.append({"query": query, "response": text, "revenue_figure_grounded": grounded})
    return rows


def main() -> None:
    print("=== Specialist prompt agents (rubric + fact-grounding judge) ===")
    specialist_rows = eval_specialists()
    passed = sum(1 for row in specialist_rows if row["result"] == "pass")
    for row in specialist_rows:
        print(f"[{row['result'].upper():7}] {row['scenario']:14} {row['role']:22} {row['reason']}")
    print(f"\nSpecialists: {passed}/{len(specialist_rows)} passed\n")

    print("=== Hosted agent (supplychain-nexus) tool-grounding check ===")
    hosted_rows = eval_hosted_agent()
    for row in hosted_rows:
        print(f"revenue_figure_grounded={row['revenue_figure_grounded']}  query={row['query']}")
        print(f"  -> {row['response'][:300]}\n")

    Path("scripts/local_eval_results.json").write_text(
        json.dumps({"specialists": specialist_rows, "hosted_agent": hosted_rows}, indent=2, default=str)
    )
    print("Saved full results to scripts/local_eval_results.json")


if __name__ == "__main__":
    main()
