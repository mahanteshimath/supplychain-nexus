from app.agent import _DISPATCH, _base_url


def test_impact_tool_returns_golden_exposure():
    result = _DISPATCH["get_supplier_impact"](supplier_id="SUP-042", disruption_days=14)

    assert result["revenue_at_risk"] == 4200000
    assert result["customer_orders_at_risk"] == 127
    assert len(result["affected_plants"]) == 3
    assert "affected_customer_orders" not in result


def test_strategy_tool_recommends_alternate_supplier():
    result = _DISPATCH["compare_recovery_strategies"](supplier_id="SUP-042", disruption_days=14)

    assert result["recommended_strategy"]["strategy_name"] == "ALTERNATE_SUPPLIER"
    assert len(result["strategies"]) == 5


def test_base_url_targets_account_v1_route(monkeypatch):
    monkeypatch.setenv(
        "AZURE_AI_PROJECT_ENDPOINT",
        "https://cog-abc.services.ai.azure.com/api/projects/proj",
    )

    assert _base_url() == "https://cog-abc.services.ai.azure.com/openai/v1"
