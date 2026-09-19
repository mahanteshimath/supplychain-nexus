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
        # Real short-inventory-coverage suppliers, mirrored here so the fallback twin
        # supports the same scenarios as the live Snowflake-backed data.
        "SUP-078": "Caldera Precision GmbH",
        "SUP-236": "Stratos Polymers GmbH",
        "SUP-097": "Lumen Precision S.A.",
        "SUP-012": "Ostwald Hydraulics Industries",
    }
    materials = (
        Material("MAT-1007", "SUP-042", 5200, 1000),
        Material("MAT-1012", "SUP-042", 2600, 500),
        Material("MAT-1099", "SUP-018", 10000, 250),
        Material("MAT-2044", "SUP-077", 8000, 600),
        Material("MAT-3078", "SUP-078", 25684, 6820),
        Material("MAT-3236", "SUP-236", 13530, 3294),
        Material("MAT-3097", "SUP-097", 5341, 1222),
        Material("MAT-3012", "SUP-012", 6785, 1499),
    )
    components = (
        Component("COMP-204", "MAT-1007"),
        Component("COMP-205", "MAT-1012"),
        Component("COMP-301", "MAT-1099"),
        Component("COMP-410", "MAT-2044"),
        Component("COMP-578", "MAT-3078"),
        Component("COMP-736", "MAT-3236"),
        Component("COMP-897", "MAT-3097"),
        Component("COMP-912", "MAT-3012"),
    )
    products = (
        Product("PROD-5001", ("COMP-204", "COMP-301")),
        Product("PROD-5004", ("COMP-204",)),
        Product("PROD-5012", ("COMP-205",)),
        Product("PROD-5999", ("COMP-301",)),
        Product("PROD-6002", ("COMP-410",)),
        Product("PROD-6078", ("COMP-578",)),
        Product("PROD-6236", ("COMP-736",)),
        Product("PROD-6097", ("COMP-897",)),
        Product("PROD-6012", ("COMP-912",)),
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
    ) + tuple(
        CustomerOrder(
            order_id=f"CO-{910001 + index}",
            product_id=product_id,
            plant_id=plants[index % len(plants)],
            revenue=revenue,
            customer_tier=1 if index < count // 2 else 2,
        )
        for product_id, revenue, count in (
            ("PROD-6002", 28000, 20),
            ("PROD-6078", 24500, 18),
            ("PROD-6236", 31000, 16),
            ("PROD-6097", 19500, 14),
            ("PROD-6012", 22000, 12),
        )
        for index in range(count)
    )
    return GoldenTwin(suppliers, materials, components, products, customer_orders)