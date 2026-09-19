from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.domain import build_golden_twin
from app.impact import calculate_supplier_impact, impact_network
from app.simulation import recommend_recovery, simulate_strategies
from app.workflow import RecoveryWorkflow

settings = get_settings()
twin = build_golden_twin()
workflow = RecoveryWorkflow(twin)
app = FastAPI(title=settings.app_name, version="0.1.0")


class ApprovalRequest(BaseModel):
    user: str
    role: str


@app.get("/api/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "data_profile": settings.data_profile,
        "data_backend": settings.data_backend,
    }


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


@app.get("/api/audit")
def audit_log() -> list[dict[str, object]]:
    return workflow.audit_log


@app.get("/api/impact/{supplier_id}")
def supplier_impact(supplier_id: str, disruption_days: int = 14) -> dict[str, object]:
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