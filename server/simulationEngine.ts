import {
  ImpactAnalysisResult,
  SimulationStrategyResult,
  RecoveryPlan,
  CustomerOrder,
} from '../src/types/index.js';
import { digitalTwin } from './digitalTwin.js';

export class SimulationEngine {
  /**
   * Run Deterministic Impact Analysis for a given disruption
   */
  public calculateImpact(
    supplierId: string = 'SUP-042',
    disruptionDays: number = 14
  ): ImpactAnalysisResult {
    const supplier = digitalTwin.suppliers.get(supplierId) || digitalTwin.suppliers.get('SUP-042')!;
    
    // 1. Trace affected materials
    const affectedMaterials = Array.from(digitalTwin.materials.values())
      .filter((m) => m.primary_supplier_id === supplier.supplier_id)
      .map((m) => {
        const coverageDays = Number((m.available_inventory / m.daily_consumption_rate).toFixed(1));
        return {
          material_id: m.material_id,
          material_name: m.material_name,
          available_qty: m.available_inventory,
          daily_consumption: m.daily_consumption_rate,
          coverage_days: coverageDays,
          stockout_day: coverageDays,
          criticality: m.criticality,
        };
      });

    // Default to MAT-1007 and MAT-1012 if none found
    const materialIds = affectedMaterials.length > 0
      ? affectedMaterials.map((m) => m.material_id)
      : ['MAT-1007', 'MAT-1012'];

    // 2. Trace affected components via BOM
    const affectedComponents: { component_id: string; component_name: string; required_material_id: string }[] = [];
    const affectedProductIds = new Set<string>();

    for (const bom of digitalTwin.boms) {
      if (materialIds.includes(bom.component_item_id)) {
        affectedComponents.push({
          component_id: bom.parent_item_id,
          component_name: bom.parent_item_id.startsWith('COMP') ? 'Optoelectronic / Power Module' : 'Direct Assembly',
          required_material_id: bom.component_item_id,
        });
        affectedProductIds.add(bom.product_id);
      }
    }

    // 3. Trace affected finished products
    const affectedProducts = Array.from(affectedProductIds)
      .map((pid) => digitalTwin.products.get(pid))
      .filter(Boolean)
      .map((p) => ({
        product_id: p!.product_id,
        product_name: p!.product_name,
        unit_price: p!.unit_price,
        affected_margin: p!.margin,
      }));

    // 4. Affected Plants
    const affectedPlants = [
      {
        plant_id: 'PLANT-03',
        plant_name: 'Nexora Advanced Systems — Stuttgart',
        production_orders_impacted: 58,
        location: 'Germany (EMEA)',
      },
      {
        plant_id: 'PLANT-07',
        plant_name: 'Nexora Heavy Machinery — Detroit',
        production_orders_impacted: 44,
        location: 'USA (AMER)',
      },
      {
        plant_id: 'PLANT-11',
        plant_name: 'Nexora Mechatronics Fab — Yokohama',
        production_orders_impacted: 25,
        location: 'Japan (APAC)',
      },
    ];

    // 5. Customer Orders & Financial Exposure
    const allCustomerOrders = Array.from(digitalTwin.customerOrders.values());
    const minCoverage = affectedMaterials.length > 0
      ? Math.min(...affectedMaterials.map((m) => m.coverage_days))
      : 5.2;

    const leadTimeGap = Math.max(0, disruptionDays - minCoverage);

    // Scale calculation based on duration
    const baseExposure = 4200000;
    const durationFactor = Math.min(1.5, Math.max(0.4, disruptionDays / 14));
    const revenueAtRisk = Math.round(baseExposure * durationFactor);
    const marginAtRisk = Math.round(revenueAtRisk * 0.383);
    const totalOrdersAtRisk = Math.round(127 * durationFactor);

    return {
      disruption_event_id: 'EVT-2026-042',
      supplier_id: supplier.supplier_id,
      supplier_name: supplier.supplier_name,
      disruption_duration_days: disruptionDays,
      severity: disruptionDays >= 14 ? 'CRITICAL' : disruptionDays >= 7 ? 'HIGH' : 'MEDIUM',
      revenue_at_risk: revenueAtRisk,
      margin_at_risk: marginAtRisk,
      customer_orders_at_risk: totalOrdersAtRisk,
      affected_customer_orders: allCustomerOrders,
      affected_materials: affectedMaterials,
      affected_components: [
        { component_id: 'COMP-204', component_name: 'Optoelectronic MCU Sub-Assembly', required_material_id: 'MAT-1007' },
        { component_id: 'COMP-205', component_name: 'High-Voltage Power Inverter Unit', required_material_id: 'MAT-1012' },
      ],
      affected_products: affectedProducts,
      affected_plants: affectedPlants,
      inventory_coverage_days: minCoverage,
      lead_time_gap_days: Number(leadTimeGap.toFixed(1)),
      sla_impact: {
        orders_at_risk: totalOrdersAtRisk,
        orders_delayed: totalOrdersAtRisk,
        average_delay_days: Number(leadTimeGap.toFixed(1)),
        maximum_delay_days: disruptionDays,
        tier_1_orders_delayed: Math.round(totalOrdersAtRisk * 0.45),
      },
      root_cause_summary: `Supplier ${supplier.supplier_id} (${supplier.supplier_name}) reported a ${disruptionDays}-day disruption. Internal safety stock of MAT-1007 & MAT-1012 covers exactly ${minCoverage} days of planned production run-rate. Without active intervention, stockout occurs on Day ${minCoverage}, stalling assembly of PROD-5001, PROD-5004, and PROD-5012 across Stuttgart, Detroit, and Yokohama, directly jeopardizing ${totalOrdersAtRisk} customer orders worth $${(revenueAtRisk / 1000000).toFixed(1)}M.`,
    };
  }

  /**
   * Run Deterministic Simulations for all 5 Strategies + Recommended Hybrid
   */
  public simulateStrategies(
    supplierId: string = 'SUP-042',
    disruptionDays: number = 14
  ): SimulationStrategyResult[] {
    const impact = this.calculateImpact(supplierId, disruptionDays);
    const exposure = impact.revenue_at_risk;
    const orders = impact.customer_orders_at_risk;

    // Strategy 1: DO NOTHING
    const doNothing: SimulationStrategyResult = {
      strategy_id: 'STRAT-01',
      strategy_name: 'DO_NOTHING',
      display_title: '1. Do Nothing (Unmitigated Baseline)',
      description: 'Allow supplier disruption to run its course without expediting, rerouting, or transferring inventory.',
      revenue_protected: 0,
      revenue_at_risk: exposure,
      additional_cost: 0,
      net_benefit: -exposure,
      delay_days: disruptionDays,
      orders_saved: 0,
      orders_delayed: orders,
      customer_sla_risk: 0.89,
      feasibility_score: 100,
      implementation_time_days: 0,
      key_trade_offs: [
        'Zero additional capital outlay or freight surcharge',
        'Severe customer SLA penalty exposure and brand erosion',
        'Stoppage of 3 final assembly plants starting Day 5.2',
        'Tier-1 aerospace and EV client lines forced into shutdown',
      ],
      actions_required: ['Issue customer force-majeure notices', 'Idling of assembly lines at Stuttgart and Detroit'],
      details: {
        stockout_occurred: true,
        buffer_depleted: true,
      },
    };

    // Strategy 2: EXPEDITE
    const expediteCost = 280000;
    const expediteProtected = Math.round(exposure * 0.702); // $2.95M
    const expediteSavedOrders = Math.round(orders * 0.645);
    const expedite: SimulationStrategyResult = {
      strategy_id: 'STRAT-02',
      strategy_name: 'EXPEDITE',
      display_title: '2. Expedite Primary Supplier (SUP-042)',
      description: 'Trigger Contract Section 4.1 air-charter expedite and fund overtime shifts at Hsinchu Fab.',
      revenue_protected: expediteProtected,
      revenue_at_risk: exposure - expediteProtected,
      additional_cost: expediteCost,
      net_benefit: expediteProtected - expediteCost,
      delay_days: 5,
      orders_saved: expediteSavedOrders,
      orders_delayed: orders - expediteSavedOrders,
      customer_sla_risk: 0.28,
      feasibility_score: 92,
      implementation_time_days: 2,
      key_trade_offs: [
        'Rapid delivery reduction from 14d down to 5d',
        'Requires chartered Antonov/FedEx freight surcharge ($280K)',
        'Contingent on cleanroom sanitization completing on schedule',
        'Protects 82 Tier-1 customer orders',
      ],
      actions_required: [
        'Authorize Air Freight Charter requisition PO-EXP-991',
        'Approve $280K non-standard freight variance code',
      ],
      details: {
        expedite_lead_time_days: 5,
        premium_rate_pct: 15,
      },
    };

    // Strategy 3: INVENTORY REALLOCATION
    const reallocateCost = 145000;
    const reallocateProtected = Math.round(exposure * 0.576); // $2.42M
    const reallocateSavedOrders = Math.round(orders * 0.559);
    const reallocate: SimulationStrategyResult = {
      strategy_id: 'STRAT-03',
      strategy_name: 'REALLOCATE',
      display_title: '3. Multi-Plant Buffer Reallocation',
      description: 'Transfer 3,800 reserved units from Munich Distribution Hub (PLANT-05) to Stuttgart (PLANT-03) and Detroit.',
      revenue_protected: reallocateProtected,
      revenue_at_risk: exposure - reallocateProtected,
      additional_cost: reallocateCost,
      net_benefit: reallocateProtected - reallocateCost,
      delay_days: 6,
      orders_saved: reallocateSavedOrders,
      orders_delayed: orders - reallocateSavedOrders,
      customer_sla_risk: 0.35,
      feasibility_score: 95,
      implementation_time_days: 3,
      key_trade_offs: [
        'Utilizes existing company-owned inventory buffer',
        'Low execution risk without third-party vendor dependencies',
        'Reduces buffer stock in Munich to 18% of target safety levels',
        'Dedicated hot-shot road transport required ($145K)',
      ],
      actions_required: [
        'Dispatch inter-facility transfer order TR-MUN-STU-441',
        'Contract Schenker dedicated haulage with GPS telemetry',
      ],
      details: {
        units_transferred: 3800,
        source_plant: 'PLANT-05 (Munich)',
      },
    };

    // Strategy 4: ALTERNATE SUPPLIER
    const altCost = 185000;
    const altProtected = Math.round(exposure * 0.957); // $4.02M
    const altSavedOrders = Math.round(orders * 0.913);
    const alternateSupplier: SimulationStrategyResult = {
      strategy_id: 'STRAT-04',
      strategy_name: 'ALTERNATE_SUPPLIER',
      display_title: '4. Activate Alternate Supplier (SUP-118 Kyoto)',
      description: 'Invoke Contract CTR-SUP118 Clause 8.2 dual-sourcing clause to procure 6,000 units from Kyoto Precision Fab.',
      revenue_protected: altProtected,
      revenue_at_risk: exposure - altProtected,
      additional_cost: altCost,
      net_benefit: altProtected - altCost,
      delay_days: 2,
      orders_saved: altSavedOrders,
      orders_delayed: orders - altSavedOrders,
      customer_sla_risk: 0.08,
      feasibility_score: 96,
      implementation_time_days: 3,
      key_trade_offs: [
        'Maximum revenue protection ($4.02M saved)',
        'Delay reduced to just 2 calendar days',
        '+8% unit price variance ($455 vs $420)',
        'Pre-qualified ISO-9001 vendor requires zero lengthy QA requalification',
      ],
      actions_required: [
        'Execute emergency purchase order PO-ALT-8812 to SUP-118',
        'Send photolithography mask offset profiles to Kyoto Fab',
      ],
      details: {
        alternate_supplier_id: 'SUP-118',
        unit_price_premium: 35,
        transit_days: 3,
      },
    };

    // Strategy 5: PRODUCTION RESCHEDULE
    const rescheduleCost = 42000;
    const rescheduleProtected = Math.round(exposure * 0.519); // $2.18M
    const rescheduleSavedOrders = Math.round(orders * 0.504);
    const reschedule: SimulationStrategyResult = {
      strategy_id: 'STRAT-05',
      strategy_name: 'RESCHEDULE',
      display_title: '5. MRP Production Resequencing',
      description: 'Reschedule assembly queue by customer SLA priority. Tier-1 customers take precedence; Tier-3 shifted by 10 days.',
      revenue_protected: rescheduleProtected,
      revenue_at_risk: exposure - rescheduleProtected,
      additional_cost: rescheduleCost,
      net_benefit: rescheduleProtected - rescheduleCost,
      delay_days: 7,
      orders_saved: rescheduleSavedOrders,
      orders_delayed: orders - rescheduleSavedOrders,
      customer_sla_risk: 0.42,
      feasibility_score: 98,
      implementation_time_days: 1,
      key_trade_offs: [
        'Very low capital expenditure ($42K shift adjustment)',
        'Completely protects Boeing, Siemens, and Tesla Tier-1 deliveries',
        'Requires customer concession agreements with Tier-3 accounts',
        'Plant setup time variance increased by 14 hours',
      ],
      actions_required: [
        'Update SAP/MRP scheduling parameters for Line A & C',
        'Dispatch customer notification to Emerson and regional accounts',
      ],
      details: {
        tier_1_protected_pct: 100,
        tier_3_delayed_pct: 82,
      },
    };

    // Strategy 6: RECOMMENDED HYBRID
    const hybridCost = 192000;
    const hybridProtected = Math.round(exposure * 0.981); // $4.12M
    const hybridSavedOrders = 122;
    const hybrid: SimulationStrategyResult = {
      strategy_id: 'STRAT-06',
      strategy_name: 'RECOMMENDED_HYBRID',
      display_title: '★ Nexora AI Recommended Orchestrated Strategy',
      description: 'Blended recovery: 65% volume split to SUP-118 Kyoto, 3,500 buffer units transferred from Munich, and Tier-1 line prioritization.',
      revenue_protected: hybridProtected,
      revenue_at_risk: exposure - hybridProtected,
      additional_cost: hybridCost,
      net_benefit: hybridProtected - hybridCost,
      delay_days: 1.5,
      orders_saved: hybridSavedOrders,
      orders_delayed: orders - hybridSavedOrders,
      customer_sla_risk: 0.042,
      feasibility_score: 97,
      implementation_time_days: 2,
      key_trade_offs: [
        'Safeguards $4.12M out of $4.20M total exposure (98.1% protection)',
        'Net economic return of +$3.93M above execution cost',
        'Preserves 100% of Tier-1 customer SLAs (Boeing, Siemens, Tesla, GE)',
        'Retains 40% safety stock at Munich buffer facility',
      ],
      actions_required: [
        'Dispatch PO-ALT-9901 to SUP-118 for 4,000 units ($140K)',
        'Execute inter-plant transfer TR-MUN-092 for 3,500 units ($42K)',
        'Reschedule plant shifts in Stuttgart to prioritize Aerospace jobs ($10K)',
        'Notify Key Account Executives for Boeing and Siemens',
      ],
      details: {
        is_recommended: true,
        confidence_interval: 0.96,
      },
    };

    return [doNothing, expedite, reallocate, alternateSupplier, reschedule, hybrid];
  }

  /**
   * Build the Recommended Recovery Plan
   */
  public generateRecoveryPlan(
    supplierId: string = 'SUP-042',
    disruptionDays: number = 14
  ): RecoveryPlan {
    const impact = this.calculateImpact(supplierId, disruptionDays);
    const strategies = this.simulateStrategies(supplierId, disruptionDays);
    const hybrid = strategies.find((s) => s.strategy_name === 'RECOMMENDED_HYBRID')!;

    return {
      plan_id: 'REC-PLAN-2026-042',
      event_id: 'EVT-2026-042',
      created_at: new Date().toISOString(),
      proposed_by_agent: 'Recovery Agent (Autonomous Policy Reasoner)',
      approval_status: 'PROPOSED',
      total_revenue_exposure: impact.revenue_at_risk,
      total_revenue_protected: hybrid.revenue_protected,
      total_additional_cost: hybrid.additional_cost,
      orders_protected: hybrid.orders_saved,
      orders_delayed: hybrid.orders_delayed,
      projected_delay_days: hybrid.delay_days,
      recommended_strategy: 'Orchestrated Hybrid (Dual-Sourcing + Buffer Dispatch + Tier Prioritization)',
      executive_summary: `The Recovery Agent evaluated 5 distinct deterministic operational strategies against contract CTR-SUP042 and procurement guidelines. The recommended Orchestrated Hybrid protects $4.12M (98.1%) of exposed revenue at a total cost of $192,000. Customer SLA breach risk drops from 89% down to 4.2%, and assembly line continuity at Stuttgart and Detroit is maintained with zero downtime. Requires Human-In-The-Loop approval before PO dispatch.`,
      actions: [
        {
          action_id: 'ACT-01',
          action_type: 'ACTIVATE_ALTERNATE_SUPPLIER',
          title: 'Activate Secondary Source PO (SUP-118)',
          description: 'Procure 4,000 units of MAT-1007 from Kyoto Precision Semiconductor under CTR-SUP118 pre-negotiated dual-sourcing terms.',
          target_entity: 'SUP-118 (Kyoto Precision Fab)',
          estimated_cost: 140000,
          status: 'PENDING',
          document_ref: 'PO-ALT-9901',
        },
        {
          action_id: 'ACT-02',
          action_type: 'TRANSFER_INVENTORY',
          title: 'Inter-Plant Buffer Transfer (Munich → Stuttgart)',
          description: 'Release 3,500 units of reserved silicon substrates from Munich Buffer Hub (PLANT-05) via dedicated GPS-tracked express courier.',
          target_entity: 'PLANT-05 → PLANT-03',
          estimated_cost: 42000,
          status: 'PENDING',
          document_ref: 'TR-MUN-092',
        },
        {
          action_id: 'ACT-03',
          action_type: 'RESCHEDULE_PRODUCTION',
          title: 'Dynamic MRP Resequencing (Tier-1 Prioritization)',
          description: 'Prioritize production orders for Boeing (ORD-900123) and Tesla (ORD-900125) on Lines A & C in Stuttgart and Detroit.',
          target_entity: 'PLANT-03 & PLANT-07 MRP Queue',
          estimated_cost: 10000,
          status: 'PENDING',
          document_ref: 'MRP-SEQ-402',
        },
        {
          action_id: 'ACT-04',
          action_type: 'NOTIFY_TIER1_CUSTOMERS',
          title: 'Automated Account Manager Briefing & Proactive SLA Notice',
          description: 'Send telemetry updates to Boeing and Siemens account directors confirming protected on-time delivery schedule.',
          target_entity: 'Boeing & Siemens Key Accounts',
          estimated_cost: 0,
          status: 'PENDING',
          document_ref: 'NOTIF-SLA-881',
        },
      ],
    };
  }
}

export const simulationEngine = new SimulationEngine();
