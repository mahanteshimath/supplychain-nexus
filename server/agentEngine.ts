import { GoogleGenAI } from '@google/genai';
import {
  AgentTraceRecord,
  RecoveryPlan,
  AuditLogEntry,
  ApprovalStatus,
} from '../src/types/index.js';
import { simulationEngine } from './simulationEngine.js';
import { digitalTwin } from './digitalTwin.js';

export class AgentOrchestrator {
  public traceLogs: AgentTraceRecord[] = [];
  public currentPlan: RecoveryPlan | null = null;
  public auditLogs: AuditLogEntry[] = [];
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    this.initGemini();
    this.seedInitialAuditLog();
    this.runFullOrchestrationTrace('SUP-042', 14);
  }

  private initGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  private seedInitialAuditLog() {
    this.auditLogs = [
      {
        log_id: 'LOG-001',
        timestamp: '2026-09-18T08:31:05Z',
        event_id: 'EVT-2026-042',
        action_title: 'Disruption Detected & Ingested',
        action_type: 'TELEMETRY_INGESTION',
        requested_by_agent: 'Orchestrator',
        approved_by_user: 'SYSTEM_AUTONOMOUS',
        user_role: 'SYSTEM',
        approval_status: 'APPROVED',
        execution_status: 'COMPLETED',
        result_summary: 'Ingested EDI-855 ASN delay notice from Apex Micro-Foundry (SUP-042) for 14-day production halt.',
        document_reference: 'EDI-855-APEX-9921',
      },
      {
        log_id: 'LOG-002',
        timestamp: '2026-09-18T08:31:14Z',
        event_id: 'EVT-2026-042',
        action_title: 'Multi-Echelon Impact Analysis Generated',
        action_type: 'IMPACT_TRACING',
        requested_by_agent: 'Impact Agent',
        approved_by_user: 'SYSTEM_AUTONOMOUS',
        user_role: 'SYSTEM',
        approval_status: 'APPROVED',
        execution_status: 'COMPLETED',
        result_summary: 'Traced MAT-1007/1012 through BOM to 3 products and 127 customer orders. Revenue exposure identified at $4.2M.',
        document_reference: 'IMP-REPORT-042',
      },
    ];
  }

  /**
   * Run the end-to-end multi-agent pipeline
   */
  public runFullOrchestrationTrace(
    supplierId: string = 'SUP-042',
    disruptionDays: number = 14
  ) {
    const startTime = Date.now();
    const traces: AgentTraceRecord[] = [];

    // STEP 1: Orchestrator identifies problem & spawns sub-agents
    traces.push({
      step_id: 'TRACE-001',
      agent_name: 'Orchestrator',
      tool_name: 'ingest_disruption_event',
      timestamp: new Date(startTime - 24000).toISOString(),
      duration_ms: 120,
      status: 'SUCCESS',
      input_payload: {
        event_id: 'EVT-2026-042',
        target_entity: supplierId,
        reported_delay_days: disruptionDays,
        telemetry_source: 'AS2 EDI Feed',
      },
      output_payload: {
        event_severity: 'CRITICAL',
        disruption_status: 'INVESTIGATING',
        triggered_agents: ['Impact Agent', 'Simulation Agent', 'Recovery Agent'],
      },
      reasoning_note: `Received critical delay notice from ${supplierId}. Supplier lead time expanded by ${disruptionDays} days. Initiating digital twin cascade analysis across manufacturing topology.`,
    });

    // STEP 2: Impact Agent traces materials and inventory coverage
    const impact = simulationEngine.calculateImpact(supplierId, disruptionDays);
    traces.push({
      step_id: 'TRACE-002',
      agent_name: 'Impact Agent',
      tool_name: 'trace_bom_and_inventory_runway',
      timestamp: new Date(startTime - 21000).toISOString(),
      duration_ms: 380,
      status: 'SUCCESS',
      input_payload: {
        supplier_id: supplierId,
        materials_queried: ['MAT-1007', 'MAT-1012'],
      },
      output_payload: {
        affected_materials: impact.affected_materials,
        inventory_coverage_days: impact.inventory_coverage_days,
        stockout_day: impact.inventory_coverage_days,
        lead_time_gap_days: impact.lead_time_gap_days,
      },
      reasoning_note: `Primary materials MAT-1007 and MAT-1012 have exactly ${impact.inventory_coverage_days} days of available inventory runway at current burn-rate. Stockout is guaranteed on Day ${impact.inventory_coverage_days} without mitigation.`,
    });

    // STEP 3: Impact Agent traces customer orders & revenue exposure
    traces.push({
      step_id: 'TRACE-003',
      agent_name: 'Impact Agent',
      tool_name: 'calculate_financial_exposure',
      timestamp: new Date(startTime - 18000).toISOString(),
      duration_ms: 240,
      status: 'SUCCESS',
      input_payload: {
        downstream_products: impact.affected_products.map((p) => p.product_id),
        impacted_plants: impact.affected_plants.map((p) => p.plant_id),
      },
      output_payload: {
        revenue_at_risk: impact.revenue_at_risk,
        margin_at_risk: impact.margin_at_risk,
        orders_at_risk: impact.customer_orders_at_risk,
        tier_1_customers_exposed: ['Boeing', 'Siemens', 'Tesla', 'GE Healthcare'],
      },
      reasoning_note: `Multi-echelon graph traversal reveals $${(impact.revenue_at_risk / 1000000).toFixed(2)}M in revenue exposure across ${impact.customer_orders_at_risk} customer orders. Tier-1 aerospace and medical SLAs are at acute risk.`,
    });

    // STEP 4: Simulation Agent executes 5 deterministic strategies
    const strategies = simulationEngine.simulateStrategies(supplierId, disruptionDays);
    traces.push({
      step_id: 'TRACE-004',
      agent_name: 'Simulation Agent',
      tool_name: 'execute_deterministic_simulations',
      timestamp: new Date(startTime - 14000).toISOString(),
      duration_ms: 510,
      status: 'SUCCESS',
      input_payload: {
        scenario: '14-Day Delivery Delay',
        strategies_evaluated: [
          'DO_NOTHING',
          'EXPEDITE',
          'REALLOCATE',
          'ALTERNATE_SUPPLIER',
          'RESCHEDULE',
        ],
      },
      output_payload: {
        strategy_count: strategies.length,
        results_summary: strategies.map((s) => ({
          strategy: s.strategy_name,
          revenue_protected: s.revenue_protected,
          cost: s.additional_cost,
          delay_days: s.delay_days,
          orders_saved: s.orders_saved,
          sla_risk: s.customer_sla_risk,
        })),
      },
      reasoning_note: `Simulated all 5 deterministic mitigation vectors. Strategy 4 (Alternate Supplier SUP-118) protects 95.7% of revenue with 2-day delay. Reallocation from Munich protects 57.6%. Rescheduling prioritizes Tier-1 at minimal cost ($42K).`,
    });

    // STEP 5: Recovery Agent evaluates contract terms & constructs hybrid plan
    const plan = simulationEngine.generateRecoveryPlan(supplierId, disruptionDays);
    this.currentPlan = plan;

    traces.push({
      step_id: 'TRACE-005',
      agent_name: 'Recovery Agent',
      tool_name: 'synthesize_recovery_policy',
      timestamp: new Date(startTime - 9000).toISOString(),
      duration_ms: 460,
      status: 'SUCCESS',
      input_payload: {
        contract_references: ['CTR-SUP042 Section 4.1', 'CTR-SUP118 Clause 8.2'],
        corporate_procurement_guideline: 'SLA_PROTECTION_PRIORITY_V3',
      },
      output_payload: {
        recommended_strategy: plan.recommended_strategy,
        revenue_protected: plan.total_revenue_protected,
        net_economic_benefit: plan.total_revenue_protected - plan.total_additional_cost,
        proposed_action_count: plan.actions.length,
      },
      reasoning_note: `Combined alternate sourcing with inter-plant inventory transfer and MRP prioritization. Verified that CTR-SUP118 dual-sourcing clause is legally authorized. Generated formal 4-part action proposal requiring human approval.`,
    });

    // STEP 6: Orchestrator prepares Human-In-The-Loop submission
    traces.push({
      step_id: 'TRACE-006',
      agent_name: 'Orchestrator',
      tool_name: 'await_human_authorization',
      timestamp: new Date(startTime - 2000).toISOString(),
      duration_ms: 15,
      status: 'SUCCESS',
      input_payload: {
        plan_id: plan.plan_id,
        financial_threshold: 100000,
        required_role: 'SUPPLY_CHAIN_MANAGER',
      },
      output_payload: {
        gate_status: 'PENDING_HUMAN_APPROVAL',
        modal_prompt_ready: true,
      },
      reasoning_note: `Plan requires $192,000 in operational expenditure (exceeds $100K automated execution threshold). Halting autonomous execution and delegating approval to Supply Chain Manager or Executive.`,
    });

    this.traceLogs = traces;
  }

  /**
   * Execute Human-In-The-Loop Approval
   */
  public approveRecoveryPlan(
    user: string = 'Director of Supply Chain',
    role: string = 'SUPPLY_CHAIN_MANAGER'
  ): { success: boolean; plan: RecoveryPlan; auditEntry: AuditLogEntry } {
    if (!this.currentPlan) {
      this.currentPlan = simulationEngine.generateRecoveryPlan('SUP-042', 14);
    }

    const plan = this.currentPlan;
    plan.approval_status = 'APPROVED';
    plan.approved_by_user = user;
    plan.approval_timestamp = new Date().toISOString();

    // Mark actions as running then completed
    plan.actions.forEach((act) => {
      act.status = 'COMPLETED';
      act.execution_result = `Executed successfully via ERP connector. Ref: ${act.document_ref}`;
    });

    // Add Action Agent execution trace
    this.traceLogs.push({
      step_id: `TRACE-${Date.now()}`,
      agent_name: 'Action Agent',
      tool_name: 'execute_recovery_actions',
      timestamp: new Date().toISOString(),
      duration_ms: 680,
      status: 'SUCCESS',
      input_payload: {
        plan_id: plan.plan_id,
        approved_by: user,
        user_role: role,
        actions_to_execute: plan.actions.map((a) => a.action_id),
      },
      output_payload: {
        executed_actions: [
          { action: 'ACT-01', result: 'Dispatched PO-ALT-9901 to SUP-118 for 4,000 units' },
          { action: 'ACT-02', result: 'Issued TR-MUN-092 inter-plant transfer for 3,500 units' },
          { action: 'ACT-03', result: 'Updated MRP dispatch queue on Lines A & C' },
          { action: 'ACT-04', result: 'Notified Boeing & Siemens Key Account teams' },
        ],
        verification_status: 'VERIFIED_ON_SCHEDULE',
        new_revenue_at_risk: 80000,
        supply_chain_health_score: 94,
      },
      reasoning_note: `Human approval received from ${user} (${role}). Action Agent executed all 4 operational actions across SAP ERP and WMS. Recalculated residual revenue exposure down to $80,000 (from $4.20M). Disruption mitigated.`,
    });

    // Add to Audit Log
    const auditEntry: AuditLogEntry = {
      log_id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event_id: 'EVT-2026-042',
      action_title: 'Recovery Plan Approved & Executed',
      action_type: 'HITL_PLAN_EXECUTION',
      requested_by_agent: 'Recovery Agent',
      approved_by_user: user,
      user_role: role,
      approval_status: 'EXECUTED',
      execution_status: 'COMPLETED',
      result_summary: `Plan REC-PLAN-2026-042 approved. Activated alternate supplier SUP-118, transferred 3,500 buffer units from Munich, and re-sequenced MRP queue. Residual risk: $80K.`,
      document_reference: 'PO-ALT-9901 / TR-MUN-092',
    };
    this.auditLogs.unshift(auditEntry);

    // Update digital twin event status
    const evt = digitalTwin.events.get('EVT-2026-042');
    if (evt) {
      evt.status = 'RESOLVED';
      evt.estimated_revenue_impact = 80000;
    }

    return { success: true, plan, auditEntry };
  }

  /**
   * Reject Recovery Plan
   */
  public rejectRecoveryPlan(user: string = 'Director of Supply Chain') {
    if (this.currentPlan) {
      this.currentPlan.approval_status = 'REJECTED';
      this.currentPlan.approved_by_user = user;
      this.currentPlan.approval_timestamp = new Date().toISOString();

      this.auditLogs.unshift({
        log_id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event_id: 'EVT-2026-042',
        action_title: 'Recovery Plan Rejected by Planner',
        action_type: 'HITL_PLAN_REJECTION',
        requested_by_agent: 'Recovery Agent',
        approved_by_user: user,
        user_role: 'SUPPLY_CHAIN_MANAGER',
        approval_status: 'REJECTED',
        execution_status: 'COMPLETED',
        result_summary: 'Proposed recovery plan was rejected. Disruption returned to INVESTIGATING status for alternative scenario synthesis.',
        document_reference: 'REJ-042',
      });
    }
    return { success: true };
  }

  /**
   * Generate Live AI Executive Insight using Gemini
   */
  public async generateExecutiveSynthesis(disruptionTitle: string, revenueExposure: number) {
    if (this.aiClient) {
      try {
        const prompt = `You are the Lead Supply Chain Architect and Agent Orchestrator for Nexora Manufacturing.
Analyze this high-impact supply chain event:
- Disruption: ${disruptionTitle}
- Financial Exposure: $${(revenueExposure / 1000000).toFixed(1)}M
- Disrupted Supplier: Apex Micro-Foundry (SUP-042)
- Alternative Supplier Available: Kyoto Precision (SUP-118, 3-day lead time, +8% unit premium)
- Buffer Warehouse: Munich Hub (PLANT-05) has 4,200 units available

Provide a concise 3-paragraph executive brief for the Chief Operating Officer:
1. Operational bottleneck & BOM dependency analysis
2. Strategic trade-offs between expediting vs alternate sourcing vs buffer transfer
3. Final recommended action mandate with ROI justification`;

        const response = await this.aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) {
          return { source: 'gemini-live', text: response.text };
        }
      } catch (err: any) {
        console.warn('Gemini live call error, using deterministic policy engine:', err?.message);
      }
    }

    // Heuristic synthesis fallback
    return {
      source: 'deterministic-policy-engine',
      text: `### Executive Operational Synthesis: Disruption SUP-042

**1. Root Cause & Structural Vulnerability**
The 14-day delivery failure at Apex Micro-Foundry (SUP-042) directly threatens gallium-nitride and silicon sensor substrates (MAT-1007/1012). Because internal safety stocks at Stuttgart and Detroit provide only 5.2 days of operating buffer, line starvation begins on Day 6, freezing production of NexTurbine 9000 and NexDrive Servo controllers.

**2. Comparative Strategy Trade-Offs**
- *Expediting Primary Supplier ($280K)*: High risk due to cleanroom recertification uncertainties.
- *Internal Buffer Transfer ($145K)*: Safely bridges 6 days but exhausts European regional reserves to 18%.
- *Alternate Sourcing SUP-118 ($185K)*: Best balance—provides verified ISO-9001 parts in 3 days with +$3.93M net return.

**3. Strategic Action Mandate**
The Multi-Agent Orchestrator recommends approving the **Hybrid Sourcing & Buffer Release Plan**. This protects 98.1% of customer orders, shields Boeing and Siemens SLA guarantees, and incurs only $192,000 in blended operational costs.`,
    };
  }
}

export const orchestrator = new AgentOrchestrator();
