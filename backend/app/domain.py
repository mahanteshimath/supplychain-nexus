from dataclasses import dataclass


@dataclass(frozen=True)
class Material:
    material_id: str
    supplier_id: str
    available_qty: float
    daily_consumption: float
    criticality: str = "CRITICAL"


@dataclass(frozen=True)
class Component:
    component_id: str
    material_id: str


@dataclass(frozen=True)
class Product:
    product_id: str
    component_ids: tuple[str, ...]


@dataclass(frozen=True)
class CustomerOrder:
    order_id: str
    product_id: str
    plant_id: str
    revenue: int
    customer_tier: int


@dataclass(frozen=True)
class GoldenTwin:
    suppliers: dict[str, str]
    materials: tuple[Material, ...]
    components: tuple[Component, ...]
    products: tuple[Product, ...]
    customer_orders: tuple[CustomerOrder, ...]


def build_golden_twin() -> GoldenTwin:
    suppliers = {
        "SUP-042": "Apex Micro-Foundry",
        "SUP-018": "Northern Materials Group",
        "SUP-077": "Continent Power Systems",
    }
    materials = (
        Material("MAT-1007", "SUP-042", 5200, 1000),
        Material("MAT-1012", "SUP-042", 2600, 500),
        Material("MAT-1099", "SUP-018", 10000, 250),
    )
    components = (
        Component("COMP-204", "MAT-1007"),
        Component("COMP-205", "MAT-1012"),
        Component("COMP-301", "MAT-1099"),
    )
    products = (
        Product("PROD-5001", ("COMP-204", "COMP-301")),
        Product("PROD-5004", ("COMP-204",)),
        Product("PROD-5012", ("COMP-205",)),
        Product("PROD-5999", ("COMP-301",)),
    )
    affected_products = ("PROD-5001", "PROD-5004", "PROD-5012")
    plants = ("PLANT-03", "PLANT-07", "PLANT-11")
    revenues = [33000] * 126 + [42000]
    customer_orders = tuple(
        CustomerOrder(
            order_id=f"CO-{900001 + index}",
            product_id=affected_products[index % len(affected_products)],
            plant_id=plants[index % len(plants)],
            revenue=revenue,
            customer_tier=1 if index < 57 else 2,
        )
        for index, revenue in enumerate(revenues)
    ) + (
        CustomerOrder("CO-999001", "PROD-5999", "PLANT-03", 85000, 2),
    )
    return GoldenTwin(suppliers, materials, components, products, customer_orders)