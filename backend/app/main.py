from dataclasses import asdict
from datetime import datetime, timezone
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.agent import extract_output_text, run_responses
from app.config import get_settings
from app.impact import calculate_supplier_impact, impact_network
from app.orchestrator import run_orchestration
from app.simulation import recommend_recovery, simulate_strategies
from app.twin import active_twin
from app.workflow import RecoveryWorkflow

settings = get_settings()
twin = active_twin()
workflow = RecoveryWorkflow(twin)
app = FastAPI(title=settings.app_name, version="0.1.0")

DISRUPTION_EVENT_ID = "EVT-2026-042"
SCENARIO_ID = "SCN-001"

# Most recent orchestration, so the trace view shows a real run rather than a rebuild.
_last_run: dict[str, object | None] = {"value": None}

SCENARIOS: tuple[dict[str, object], ...] = (
    {
        "scenario_id": "SCN-001",
        "code": "SUP042-14D",
        "name": "Apex Micro-Foundry 14-Day Delay",
        "description": "Cleanroom lithography sensor contamination halts SUP-042 output for 14 days.",
        "target_entity": "SUP-042",
        "duration_days": 14,
    },
    {
        "scenario_id": "SCN-002",
        "code": "SUP078-10D",
        "name": "Caldera Precision GmbH 10-Day Delay",
        "description": "A tooling failure halts SUP-078 precision-machined output for 10 days.",
        "target_entity": "SUP-078",
        "duration_days": 10,
    },
    {
        "scenario_id": "SCN-003",
        "code": "SUP236-12D",
        "name": "Stratos Polymers GmbH 12-Day Delay",
        "description": "A resin shortage delays SUP-236 polymer component output for 12 days.",
        "target_entity": "SUP-236",
        "duration_days": 12,
    },
    {
        "scenario_id": "SCN-004",
        "code": "SUP097-20D",
        "name": "Lumen Precision S.A. 20-Day Delay",
        "description": "A plant relocation suspends SUP-097 precision output for 20 days.",
        "target_entity": "SUP-097",
        "duration_days": 20,
    },
    {
        "scenario_id": "SCN-005",
        "code": "SUP012-7D",
        "name": "Ostwald Hydraulics Industries 7-Day Delay",
        "description": "A labor strike halts SUP-012 hydraulics output for 7 days.",
        "target_entity": "SUP-012",
        "duration_days": 7,
    },
)
_SCENARIOS_BY_ID = {scenario["scenario_id"]: scenario for scenario in SCENARIOS}
_active_scenario_id: dict[str, str] = {"value": SCENARIO_ID}


class ApprovalRequest(BaseModel):
    user: str
    role: str


class RejectRequest(BaseModel):
    user: str


class ScenarioActivateRequest(BaseModel):
    scenario_id: str


class SimulationRequest(BaseModel):
    supplier_id: str = "SUP-042"
    disruption_days: int = 14


def _scenario_severity(scenario: dict[str, object]) -> str:
    return calculate_supplier_impact(twin, str(scenario["target_entity"]), int(scenario["duration_days"]))["severity"]


def _scenario_view(scenario: dict[str, object]) -> dict[str, object]:
    return {
        **scenario,
        "severity": _scenario_severity(scenario),
        "parameters": {"supplier_id": scenario["target_entity"], "delay_days": scenario["duration_days"]},
    }


def _scenario() -> dict[str, object]:
    return _scenario_view(_SCENARIOS_BY_ID[_active_scenario_id["value"]])


def _disruption_event() -> dict[str, object]:
    impact = workflow.impact
    return {
        "event_id": DISRUPTION_EVENT_ID,
        "event_type": "SUPPLIER_DELAY",
        "event_date": "2026-01-05T00:00:00Z",
        "entity_type": "SUPPLIER",
        "entity_id": workflow.supplier_id,
        "entity_name": impact["supplier_name"],
        "severity": impact["severity"],
        "duration_days": workflow.disruption_days,
        "probability": 1.0,
        "description": (
            f"{impact['supplier_name']} ({workflow.supplier_id}) disrupted for "
            f"{workflow.disruption_days} days, putting ${impact['revenue_at_risk']:,} at risk."
        ),
        "source": "Deterministic supply-chain twin",
        "status": "RESOLVED" if workflow.status == "EXECUTED" else "ACTION_REQUIRED",
        "estimated_revenue_impact": impact["revenue_at_risk"],
        "affected_materials": [m["material_id"] for m in impact["affected_materials"]],
        "affected_products": [p["product_id"] for p in impact["affected_products"]],
        "affected_plants": impact["affected_plants"],
    }


@app.get("/api/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "data_profile": settings.data_profile,
        "data_backend": settings.data_backend,
    }


@app.get("/readiness")
def readiness() -> dict[str, str]:
    """Foundry probes this before routing traffic to the agent session."""
    return {"status": "ready"}


@app.post("/responses")
async def responses(request: Request) -> dict[str, object]:
    """Foundry Responses protocol entry point."""
    try:
        return run_responses(await request.json())
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@app.get("/api/dashboard")
def dashboard() -> dict[str, object]:
    return workflow.dashboard()


@app.get("/api/recovery-plans/{plan_id}")
def recovery_plan(plan_id: str) -> dict[str, object]:
    if plan_id != "REC-PLAN-2026-042":
        raise HTTPException(status_code=404, detail="Recovery plan not found")
    return workflow.plan()


@app.post("/api/recovery-plans/{plan_id}/approve")
def approve_recovery_plan(plan_id: str, request: ApprovalRequest) -> dict[str, object]:
    if plan_id != "REC-PLAN-2026-042":
        raise HTTPException(status_code=404, detail="Recovery plan not found")
    try:
        return workflow.approve(request.user, request.role)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.post("/api/recovery-plans/{plan_id}/reject")
def reject_recovery_plan(plan_id: str, request: RejectRequest) -> dict[str, object]:
    if plan_id != "REC-PLAN-2026-042":
        raise HTTPException(status_code=404, detail="Recovery plan not found")
    try:
        return workflow.reject(request.user)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.get("/api/audit")
def audit_log() -> list[dict[str, object]]:
    return workflow.audit_log


@app.get("/api/impact/{identifier}")
def supplier_impact(identifier: str, disruption_days: int = 14) -> dict[str, object]:
    supplier_id = workflow.supplier_id if identifier == DISRUPTION_EVENT_ID else identifier
    try:
        return calculate_supplier_impact(twin, supplier_id, disruption_days)
    except (KeyError, ValueError) as error:
        raise HTTPException(status_code=404 if isinstance(error, KeyError) else 422, detail=str(error)) from error


@app.get("/api/network/supplier/{supplier_id}")
def supplier_network(supplier_id: str, disruption_days: int = 14) -> dict[str, list[dict[str, object]]]:
    try:
        return impact_network(calculate_supplier_impact(twin, supplier_id, disruption_days))
    except (KeyError, ValueError) as error:
        raise HTTPException(status_code=404 if isinstance(error, KeyError) else 422, detail=str(error)) from error


@app.get("/api/simulations/{supplier_id}")
def simulations(supplier_id: str, disruption_days: int = 14) -> dict[str, object]:
    try:
        impact = calculate_supplier_impact(twin, supplier_id, disruption_days)
        strategies = simulate_strategies(impact)
        return {"impact": impact, "strategies": strategies, "recommended_strategy": recommend_recovery(strategies)}
    except (KeyError, ValueError) as error:
        raise HTTPException(status_code=404 if isinstance(error, KeyError) else 422, detail=str(error)) from error


@app.post("/api/simulations")
def run_simulation(request: SimulationRequest) -> dict[str, object]:
    try:
        impact = calculate_supplier_impact(twin, request.supplier_id, request.disruption_days)
        strategies = simulate_strategies(impact)
        return {
            "simulation_id": f"SIM-{int(time.time())}",
            "supplier_id": request.supplier_id,
            "disruption_days": request.disruption_days,
            "strategies": strategies,
            "recommended_strategy": recommend_recovery(strategies),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except (KeyError, ValueError) as error:
        raise HTTPException(status_code=404 if isinstance(error, KeyError) else 422, detail=str(error)) from error


@app.get("/api/scenarios")
def scenarios() -> list[dict[str, object]]:
    return [_scenario_view(scenario) for scenario in SCENARIOS]


@app.post("/api/scenarios/activate")
def activate_scenario(request: ScenarioActivateRequest) -> dict[str, object]:
    scenario = _SCENARIOS_BY_ID.get(request.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {request.scenario_id}")
    _active_scenario_id["value"] = scenario["scenario_id"]
    workflow.supplier_id = str(scenario["target_entity"])
    workflow.disruption_days = int(scenario["duration_days"])
    workflow.status = "PENDING_APPROVAL"
    workflow.approved_by = None
    _last_run["value"] = None  # force the trace view to re-run for the new scenario
    return {"success": True, "active_scenario": _scenario_view(scenario), "impact": workflow.impact}


@app.get("/api/disruptions")
def disruptions() -> list[dict[str, object]]:
    return [_disruption_event()]


@app.get("/api/digital-twin/{entity}")
def digital_twin_entity(entity: str) -> list[dict[str, object]]:
    if settings.data_backend == "snowflake":
        try:
            from app.snowflake_repository import list_entity

            rows = list_entity(entity)
            if rows:
                return rows
        except Exception as error:  # noqa: BLE001 - fall back rather than 500 the explorer
            print(f"Digital twin query failed for {entity}: {error}")

    catalog: dict[str, list[dict[str, object]]] = {
        "suppliers": [{"supplier_id": sid, "supplier_name": name} for sid, name in twin.suppliers.items()],
        "materials": [asdict(m) for m in twin.materials],
        "boms": [asdict(c) for c in twin.components],
        "products": [{"product_id": p.product_id, "component_ids": list(p.component_ids)} for p in twin.products],
        "customer_orders": [asdict(o) for o in twin.customer_orders],
    }
    return catalog.get(entity, [])


@app.post("/api/agents/run")
def run_agents(request: SimulationRequest | None = None) -> dict[str, object]:
    """Execute the multi-agent pipeline and keep the resulting trace."""
    supplier = request.supplier_id if request else workflow.supplier_id
    days = request.disruption_days if request else workflow.disruption_days
    try:
        result = run_orchestration(supplier, days)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    _last_run["value"] = result
    return result


@app.get("/api/agents/runs")
def agent_runs() -> list[dict[str, object]]:
    """Steps from the most recent real run; runs the pipeline once if none exists yet."""
    if _last_run["value"] is None:
        try:
            _last_run["value"] = run_orchestration(workflow.supplier_id, workflow.disruption_days)
        except Exception as error:  # noqa: BLE001 - the trace view must not hard-fail
            print(f"Orchestration unavailable: {error}")
            return []
    return _last_run["value"]["steps"]


@app.post("/api/executive-brief")
async def executive_brief(request: Request) -> dict[str, str]:
    body = await request.json()
    title = body.get("disruption_title", "Supplier disruption")
    revenue = body.get("revenue_exposure", workflow.impact["revenue_at_risk"])
    prompt = (
        f"Write a 3-sentence executive brief for: {title}. "
        f"Revenue exposure is ${revenue:,}. Ground every figure using the tools."
    )
    try:
        result = run_responses({"input": prompt})
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return {"text": extract_output_text(result)}


_static_dir = Path(__file__).resolve().parents[1] / "static"
if _static_dir.exists():
    app.mount("/", StaticFiles(directory=_static_dir, html=True), name="frontend")


if __name__ == "__main__":
    import os

    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8088")))