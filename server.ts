import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { digitalTwin } from "./server/digitalTwin.js";
import { simulationEngine } from "./server/simulationEngine.js";
import { orchestrator } from "./server/agentEngine.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. API Health
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "SUPPLYCHAIN NEXUS Core Engine",
      version: "2.4.0",
      company: "Nexora Manufacturing Corp",
    });
  });

  // 2. Control Tower Dashboard Overview
  app.get("/api/dashboard", (req, res) => {
    const isMitigated = orchestrator.currentPlan?.approval_status === "APPROVED" || orchestrator.currentPlan?.approval_status === "EXECUTED";
    const primaryEvent = digitalTwin.events.get("EVT-2026-042");
    const activeDisruptions = Array.from(digitalTwin.events.values());

    const revenueAtRisk = isMitigated ? 80000 : 4200000;
    const healthScore = isMitigated ? 94 : 72;
    const ordersAtRisk = isMitigated ? 5 : 127;
    const plantsImpacted = isMitigated ? 1 : 3;

    res.json({
      supply_chain_health: healthScore,
      revenue_at_risk: revenueAtRisk,
      orders_at_risk: ordersAtRisk,
      active_disruptions_count: isMitigated ? 1 : activeDisruptions.filter((e) => e.status !== "RESOLVED").length,
      average_supplier_risk_score: 84,
      plants_impacted_count: plantsImpacted,
      primary_disruption: primaryEvent,
      all_disruptions: activeDisruptions,
      suppliers_count: digitalTwin.suppliers.size,
      materials_count: digitalTwin.materials.size,
      products_count: digitalTwin.products.size,
      customers_count: digitalTwin.customers.size,
      plants_summary: Array.from(digitalTwin.plants.values()),
      is_plan_approved: isMitigated,
    });
  });

  // 3. Disruptions Registry
  app.get("/api/disruptions", (req, res) => {
    res.json(Array.from(digitalTwin.events.values()));
  });

  app.get("/api/disruptions/:event_id", (req, res) => {
    const event = digitalTwin.events.get(req.params.event_id) || digitalTwin.events.get("EVT-2026-042");
    res.json(event);
  });

  // 4. Supplier Details
  app.get("/api/suppliers/:supplier_id", (req, res) => {
    const supplier = digitalTwin.suppliers.get(req.params.supplier_id) || digitalTwin.suppliers.get("SUP-042");
    res.json(supplier);
  });

  // 5. Network Graph for ReactFlow
  app.get("/api/network/:entity_type/:entity_id", (req, res) => {
    const supplierId = req.params.entity_id || "SUP-042";
    const supplier = digitalTwin.suppliers.get(supplierId) || digitalTwin.suppliers.get("SUP-042")!;
    
    // Construct rich nodes and edges for supply chain digital twin
    const nodes = [
      {
        id: "sup-042",
        type: "supplierNode",
        position: { x: 50, y: 160 },
        data: {
          label: supplier.supplier_name,
          sublabel: "Tier-1 Semiconductor Foundry (Hsinchu)",
          entity_id: supplier.supplier_id,
          risk_score: supplier.risk_score,
          lead_time: `${supplier.lead_time_days}d (+14d Delay)`,
          status: "DISRUPTED",
          category: "SUPPLIER",
        },
      },
      {
        id: "mat-1007",
        type: "materialNode",
        position: { x: 300, y: 80 },
        data: {
          label: "MAT-1007: Silicon Sensor Substrate",
          sublabel: "Wafer (8-inch GaN-ready)",
          entity_id: "MAT-1007",
          coverage: "5.2 days runway",
          stockout: "Day 5.2 Stockout",
          criticality: "CRITICAL",
          category: "MATERIAL",
        },
      },
      {
        id: "mat-1012",
        type: "materialNode",
        position: { x: 300, y: 260 },
        data: {
          label: "MAT-1012: GaN Power Switching Die",
          sublabel: "Power Electronics Module",
          entity_id: "MAT-1012",
          coverage: "5.2 days runway",
          stockout: "Day 5.2 Stockout",
          criticality: "CRITICAL",
          category: "MATERIAL",
        },
      },
      {
        id: "comp-204",
        type: "componentNode",
        position: { x: 560, y: 80 },
        data: {
          label: "COMP-204: Optoelectronic MCU",
          sublabel: "Sub-assembly with MAT-1007 & Fiber Bus",
          entity_id: "COMP-204",
          category: "COMPONENT",
          status: "STARVATION_RISK",
        },
      },
      {
        id: "comp-205",
        type: "componentNode",
        position: { x: 560, y: 260 },
        data: {
          label: "COMP-205: HV Power Inverter Unit",
          sublabel: "Sub-assembly with MAT-1012 & Thermal Shield",
          entity_id: "COMP-205",
          category: "COMPONENT",
          status: "STARVATION_RISK",
        },
      },
      {
        id: "prod-5001",
        type: "productNode",
        position: { x: 820, y: 50 },
        data: {
          label: "PROD-5001: NexTurbine 9000",
          sublabel: "$85,000 / unit | Margin 38%",
          entity_id: "PROD-5001",
          category: "PRODUCT",
        },
      },
      {
        id: "prod-5004",
        type: "productNode",
        position: { x: 820, y: 190 },
        data: {
          label: "PROD-5004: NexDrive Servo Controller",
          sublabel: "$34,000 / unit | Margin 42%",
          entity_id: "PROD-5004",
          category: "PRODUCT",
        },
      },
      {
        id: "prod-5012",
        type: "productNode",
        position: { x: 820, y: 320 },
        data: {
          label: "PROD-5012: RoboWeld Heavy Welder",
          sublabel: "$52,000 / unit | Margin 35%",
          entity_id: "PROD-5012",
          category: "PRODUCT",
        },
      },
      {
        id: "plant-03",
        type: "plantNode",
        position: { x: 1080, y: 100 },
        data: {
          label: "PLANT-03: Stuttgart Assembly",
          sublabel: "Germany | 58 Orders Impacted",
          entity_id: "PLANT-03",
          category: "PLANT",
        },
      },
      {
        id: "plant-07",
        type: "plantNode",
        position: { x: 1080, y: 240 },
        data: {
          label: "PLANT-07: Detroit Heavy Works",
          sublabel: "USA | 44 Orders Impacted",
          entity_id: "PLANT-07",
          category: "PLANT",
        },
      },
      {
        id: "cust-boeing",
        type: "customerNode",
        position: { x: 1330, y: 60 },
        data: {
          label: "Boeing Commercial Airplanes",
          sublabel: "Tier-1 | $1.2M Exposure | SLA 2d",
          entity_id: "CUST-001",
          category: "CUSTOMER",
          status: "HIGH_SLA_RISK",
        },
      },
      {
        id: "cust-siemens",
        type: "customerNode",
        position: { x: 1330, y: 180 },
        data: {
          label: "Siemens Energy AG",
          sublabel: "Tier-1 | $840K Exposure | SLA 3d",
          entity_id: "CUST-002",
          category: "CUSTOMER",
          status: "HIGH_SLA_RISK",
        },
      },
      {
        id: "cust-tesla",
        type: "customerNode",
        position: { x: 1330, y: 300 },
        data: {
          label: "Tesla Gigafactory Berlin",
          sublabel: "Tier-1 | $714K Exposure | SLA 2d",
          entity_id: "CUST-003",
          category: "CUSTOMER",
          status: "HIGH_SLA_RISK",
        },
      },
    ];

    const edges = [
      { id: "e1", source: "sup-042", target: "mat-1007", animated: true, style: { stroke: "#ef4444", strokeWidth: 2 } },
      { id: "e2", source: "sup-042", target: "mat-1012", animated: true, style: { stroke: "#ef4444", strokeWidth: 2 } },
      { id: "e3", source: "mat-1007", target: "comp-204", animated: true, style: { stroke: "#f97316", strokeWidth: 2 } },
      { id: "e4", source: "mat-1012", target: "comp-205", animated: true, style: { stroke: "#f97316", strokeWidth: 2 } },
      { id: "e5", source: "comp-204", target: "prod-5001", style: { stroke: "#64748b", strokeWidth: 1.5 } },
      { id: "e6", source: "comp-204", target: "prod-5004", style: { stroke: "#64748b", strokeWidth: 1.5 } },
      { id: "e7", source: "comp-205", target: "prod-5001", style: { stroke: "#64748b", strokeWidth: 1.5 } },
      { id: "e8", source: "comp-205", target: "prod-5012", style: { stroke: "#64748b", strokeWidth: 1.5 } },
      { id: "e9", source: "prod-5001", target: "plant-03", style: { stroke: "#3b82f6", strokeWidth: 1.5 } },
      { id: "e10", source: "prod-5004", target: "plant-03", style: { stroke: "#3b82f6", strokeWidth: 1.5 } },
      { id: "e11", source: "prod-5012", target: "plant-07", style: { stroke: "#3b82f6", strokeWidth: 1.5 } },
      { id: "e12", source: "plant-03", target: "cust-boeing", animated: true, style: { stroke: "#dc2626", strokeWidth: 2 } },
      { id: "e13", source: "plant-03", target: "cust-siemens", animated: true, style: { stroke: "#dc2626", strokeWidth: 2 } },
      { id: "e14", source: "plant-07", target: "cust-tesla", animated: true, style: { stroke: "#dc2626", strokeWidth: 2 } },
    ];

    res.json({ nodes, edges, supplier_name: supplier.supplier_name });
  });

  // 6. Impact Analysis Endpoint
  app.get("/api/impact/:event_id", (req, res) => {
    const days = Number(req.query.days) || 14;
    const supplierId = (req.query.supplier_id as string) || "SUP-042";
    const impact = simulationEngine.calculateImpact(supplierId, days);
    res.json(impact);
  });

  // 7. Deterministic Simulation Endpoint (5 Strategies + Recommended)
  app.post("/api/simulations", (req, res) => {
    const { supplier_id = "SUP-042", disruption_days = 14 } = req.body;
    const results = simulationEngine.simulateStrategies(supplier_id, Number(disruption_days));
    res.json({
      simulation_id: `SIM-${Date.now()}`,
      supplier_id,
      disruption_days: Number(disruption_days),
      strategies: results,
      timestamp: new Date().toISOString(),
    });
  });

  // 8. Recovery Plan Endpoints
  app.get("/api/recovery-plans/:id", (req, res) => {
    if (!orchestrator.currentPlan) {
      orchestrator.currentPlan = simulationEngine.generateRecoveryPlan("SUP-042", 14);
    }
    res.json(orchestrator.currentPlan);
  });

  app.post("/api/recovery-plans/:id/approve", (req, res) => {
    const { user = "Director of Global Supply Chain", role = "SUPPLY_CHAIN_MANAGER" } = req.body;
    const result = orchestrator.approveRecoveryPlan(user, role);
    res.json(result);
  });

  app.post("/api/recovery-plans/:id/reject", (req, res) => {
    const { user = "Director of Global Supply Chain" } = req.body;
    const result = orchestrator.rejectRecoveryPlan(user);
    res.json(result);
  });

  // 9. Multi-Agent Traces
  app.get("/api/agents/runs", (req, res) => {
    res.json(orchestrator.traceLogs);
  });

  // 10. Audit Logs
  app.get("/api/audit", (req, res) => {
    res.json(orchestrator.auditLogs);
  });

  // 11. Predefined Scenarios
  app.get("/api/scenarios", (req, res) => {
    res.json(digitalTwin.scenarios);
  });

  app.post("/api/scenarios/activate", (req, res) => {
    const { scenario_id } = req.body;
    const scenario = digitalTwin.scenarios.find((s) => s.scenario_id === scenario_id) || digitalTwin.scenarios[0];
    
    // Re-run pipeline for selected scenario
    const supplierId = scenario.parameters?.supplier_id || "SUP-042";
    const durationDays = scenario.duration_days || 14;
    orchestrator.runFullOrchestrationTrace(supplierId, durationDays);

    res.json({
      success: true,
      active_scenario: scenario,
      impact: simulationEngine.calculateImpact(supplierId, durationDays),
    });
  });

  // 12. AI Executive Brief via Gemini
  app.post("/api/gemini/executive-brief", async (req, res) => {
    const { disruption_title = "Apex Micro-Foundry 14-Day Disruption", revenue_exposure = 4200000 } = req.body;
    const result = await orchestrator.generateExecutiveSynthesis(disruption_title, revenue_exposure);
    res.json(result);
  });

  // 13. Digital Twin Explorer (22 tables)
  app.get("/api/digital-twin/:entity", (req, res) => {
    const entity = req.params.entity.toLowerCase();
    switch (entity) {
      case "suppliers":
        return res.json(Array.from(digitalTwin.suppliers.values()));
      case "materials":
        return res.json(Array.from(digitalTwin.materials.values()));
      case "products":
        return res.json(Array.from(digitalTwin.products.values()));
      case "boms":
        return res.json(digitalTwin.boms);
      case "plants":
        return res.json(Array.from(digitalTwin.plants.values()));
      case "customers":
        return res.json(Array.from(digitalTwin.customers.values()));
      case "purchase_orders":
        return res.json(Array.from(digitalTwin.purchaseOrders.values()));
      case "customer_orders":
        return res.json(Array.from(digitalTwin.customerOrders.values()));
      case "contracts":
        return res.json(Array.from(digitalTwin.contracts.values()));
      default:
        return res.json({
          available_entities: [
            "suppliers",
            "materials",
            "products",
            "boms",
            "plants",
            "customers",
            "purchase_orders",
            "customer_orders",
            "contracts"
          ],
        });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SUPPLYCHAIN NEXUS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
