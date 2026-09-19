from dataclasses import asdict

from app.domain import GoldenTwin


def calculate_supplier_impact(
    twin: GoldenTwin, supplier_id: str, disruption_days: int
) -> dict[str, object]:
    if disruption_days < 1:
        raise ValueError("disruption_days must be at least one")
    if supplier_id not in twin.suppliers:
        raise KeyError(f"Unknown supplier: {supplier_id}")

    materials = [material for material in twin.materials if material.supplier_id == supplier_id]
    coverage_days = {
        material.material_id: round(material.available_qty / material.daily_consumption, 1)
        for material in materials
    }
    material_ids = set(coverage_days)
    components = [component for component in twin.components if component.material_id in material_ids]
    component_ids = {component.component_id for component in components}
    products = [
        product
        for product in twin.products
        if component_ids.intersection(product.component_ids)
    ]
    product_ids = {product.product_id for product in products}
    minimum_coverage = min(coverage_days.values(), default=0)
    affected_orders = (
        [order for order in twin.customer_orders if order.product_id in product_ids]
        if disruption_days > minimum_coverage
        else []
    )
    delay_days = round(max(0, disruption_days - minimum_coverage), 1)
    revenue_at_risk = sum(order.revenue for order in affected_orders)
    plant_ids = sorted({order.plant_id for order in affected_orders})
    # An order can carry several affected lines; the business metric counts orders.
    order_count = len({order.order_id for order in affected_orders})

    return {
        "supplier_id": supplier_id,
        "supplier_name": twin.suppliers[supplier_id],
        "disruption_duration_days": disruption_days,
        "severity": "CRITICAL" if disruption_days >= 14 else "HIGH" if disruption_days >= 7 else "MEDIUM",
        "revenue_at_risk": revenue_at_risk,
        "margin_at_risk": round(revenue_at_risk * 0.383),
        "customer_orders_at_risk": order_count,
        "affected_materials": [
            {**asdict(material), "coverage_days": coverage_days[material.material_id]}
            for material in materials
        ],
        "affected_components": [asdict(component) for component in components],
        "affected_products": [asdict(product) for product in products],
        "affected_plants": plant_ids,
        "affected_customer_orders": [asdict(order) for order in affected_orders],
        "inventory_coverage_days": minimum_coverage,
        "lead_time_gap_days": delay_days,
        "sla_impact": {
            "orders_at_risk": order_count,
            "orders_delayed": order_count,
            "average_delay_days": delay_days,
            "maximum_delay_days": disruption_days if affected_orders else 0,
            "tier_1_orders_delayed": sum(order.customer_tier == 1 for order in affected_orders),
        },
    }


def impact_network(impact: dict[str, object]) -> dict[str, list[dict[str, object]]]:
    supplier_id = str(impact["supplier_id"])
    nodes = [{"id": supplier_id, "type": "supplier", "data": {"label": supplier_id}}]
    edges: list[dict[str, object]] = []
    for material in impact["affected_materials"]:
        material_id = material["material_id"]
        nodes.append({"id": material_id, "type": "material", "data": {"label": material_id}})
        edges.append({"id": f"{supplier_id}-{material_id}", "source": supplier_id, "target": material_id, "label": "SUPPLIES"})
    for component in impact["affected_components"]:
        component_id = component["component_id"]
        material_id = component["material_id"]
        nodes.append({"id": component_id, "type": "component", "data": {"label": component_id}})
        edges.append({"id": f"{material_id}-{component_id}", "source": material_id, "target": component_id, "label": "CONTAINS"})
    for product in impact["affected_products"]:
        product_id = product["product_id"]
        nodes.append({"id": product_id, "type": "product", "data": {"label": product_id}})
        for component_id in product["component_ids"]:
            if any(component["component_id"] == component_id for component in impact["affected_components"]):
                edges.append({"id": f"{component_id}-{product_id}", "source": component_id, "target": product_id, "label": "REQUIRES"})
    return {"nodes": nodes, "edges": edges}