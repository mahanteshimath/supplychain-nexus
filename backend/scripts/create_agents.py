"""Creates the four Microsoft Foundry specialist prompt agents.

These reason and explain; they never compute. The hosted orchestrator executes every
tool against the deterministic engine and passes verified figures in as context, so the
specialists only interpret numbers that Python already produced.

Run:  python -m scripts.create_agents
"""

from __future__ import annotations

import os
import sys

from azure.identity import DefaultAzureCredential

_GROUNDING = (
    "You never calculate, estimate, or invent numbers. Every figure you mention must "
    "appear verbatim in the VERIFIED FACTS supplied to you. If a number you need is "
    "absent, say it is unavailable rather than guessing."
)

AGENTS: list[dict[str, str]] = [
    {
        "name": "nexus-impact-analyst",
        "description": "Explains the blast radius of a supply-chain disruption.",
        "instructions": (
            "You are the Impact Analyst for Nexora Manufacturing. Given verified impact "
            "figures, explain what is at risk and why, in at most four sentences. Lead with "
            "revenue at risk, affected customer orders, and inventory runway. Name the "
            "constrained materials and plants. " + _GROUNDING
        ),
    },
    {
        "name": "nexus-simulation-strategist",
        "description": "Compares deterministic recovery strategies.",
        "instructions": (
            "You are the Simulation Strategist. You receive the full set of simulated "
            "recovery strategies with their revenue protected, additional cost, delay days "
            "and SLA risk. Compare the top options and state the trade-off between cost and "
            "protection in at most four sentences. Do not recommend a winner; that is the "
            "Recovery Planner's job. " + _GROUNDING
        ),
    },
    {
        "name": "nexus-recovery-planner",
        "description": "Selects a recovery strategy and justifies it.",
        "instructions": (
            "You are the Recovery Planner. You receive the simulated strategies and the "
            "engine's recommended strategy. Justify why that strategy wins on net benefit, "
            "note its main risk, and list the concrete actions required. Keep it under five "
            "sentences. " + _GROUNDING
        ),
    },
    {
        "name": "nexus-compliance-officer",
        "description": "Checks approval thresholds and governance.",
        "instructions": (
            "You are the Compliance Officer. Given the recommended strategy cost and the "
            "approval threshold, state plainly whether human approval is required, which "
            "role must approve, and what must be recorded in the audit log. Executive "
            "approval is required above the threshold; a supply chain or procurement "
            "manager may approve below it. Keep it under four sentences. " + _GROUNDING
        ),
    },
]


def main() -> int:
    endpoint = os.getenv("AZURE_AI_PROJECT_ENDPOINT") or os.getenv("FOUNDRY_PROJECT_ENDPOINT")
    model = os.getenv("AZURE_AI_MODEL_DEPLOYMENT_NAME", "gpt-4.1-mini")
    if not endpoint:
        print("Set AZURE_AI_PROJECT_ENDPOINT first.")
        return 1

    from azure.ai.projects import AIProjectClient
    from azure.ai.projects.models import PromptAgentDefinition

    client = AIProjectClient(endpoint=endpoint, credential=DefaultAzureCredential())

    for spec in AGENTS:
        version = client.agents.create_version(
            agent_name=spec["name"],
            description=spec["description"],
            definition=PromptAgentDefinition(
                model=model,
                instructions=spec["instructions"],
                # Low temperature: these agents explain fixed numbers, they do not brainstorm.
                temperature=0.2,
            ),
        )
        print(f"{spec['name']} -> version {version.version}")

    print("\nAgent names for App Service settings:")
    print("  NEXUS_SPECIALIST_AGENTS=" + ",".join(spec["name"] for spec in AGENTS))
    return 0


if __name__ == "__main__":
    sys.exit(main())
