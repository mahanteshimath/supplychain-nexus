# SupplyChain Nexus

## Production-Ready Multi-Agent Solution Design

**Course activity:** From prototype to production with Microsoft Foundry  
**Solution:** SupplyChain Nexus  
**Business domain:** Manufacturing supply-chain resilience  
**Primary scenario:** A 14-day disruption at supplier `SUP-042`

> This document is the written submission for the activity. It describes the implemented prototype and the production architecture that would extend it. All scenario data is illustrative and must be replaced or redacted before sharing any real operational information.

## Executive Summary

SupplyChain Nexus is an AI-assisted resilience control tower for manufacturing operations. It helps supply-chain teams understand the downstream effect of a supplier disruption, compare recovery options, and submit an evidence-backed action plan for human approval.

The solution uses a multi-agent design because the problem contains different kinds of work:

- **Impact analysis** requires deterministic graph traversal and inventory calculations.
- **Recovery simulation** requires repeatable comparison of cost, delay, service-level risk, and feasibility.
- **Recovery planning** requires policy, contract, and procurement context as well as a clear approval boundary.

Microsoft Foundry provides the agent hosting, model deployment, tool-calling interface, tracing, evaluation, and operational lifecycle. The application provides the domain tools, digital-twin data, user experience, approval workflow, and audit record.

## 1. Business Problem And Users

### Business problem

A supplier disruption is often reported as an isolated delay even though its consequences cross multiple manufacturing layers. A planner needs to know which materials will stock out, which products and plants are affected, which customer orders are exposed, and which mitigation strategy protects the most value within the available time and budget.

Without a coordinated workflow, teams may:

- Spend hours manually tracing bills of material and inventory coverage.
- Recommend an expensive response without comparing alternatives.
- Miss tier-1 customer or regulatory service-level commitments.
- Execute a financially material action without the correct approval.
- Lose the reasoning and evidence behind the final decision.

For the modeled `SUP-042` event, the system traces affected materials through the BOM to products, plants, and customer orders, calculates revenue exposure, compares five strategies, and produces a recovery plan that can be approved or rejected by an authorized user.

### Intended users

| User | Need | Experience |
| --- | --- | --- |
| Supply-chain manager | Decide whether and how to intervene | Control tower, impact summary, simulation comparison, approval gate |
| MRP or production planner | Understand material runway and plant constraints | Digital twin, inventory coverage, affected orders, scenario controls |
| Procurement lead | Select and authorize alternate sourcing or expedite actions | Recovery plan, supplier and contract evidence, action list |
| Executive operations leader | Review financial exposure and business trade-offs | Executive summary, revenue protected, cost, delay, and SLA risk |
| AI or platform engineer | Diagnose, evaluate, and improve the system | Agent traces, tool telemetry, evaluation results, audit records |

## 2. Solution Design

### Agent responsibilities

#### Orchestrator Agent

The Orchestrator receives a disruption event, validates the request, sets the scenario context, and coordinates the specialist agents. It does not calculate business figures itself. It passes a structured case package containing the event ID, supplier ID, disruption duration, severity, and correlation ID to downstream agents.

#### Impact Agent

The Impact Agent answers: **What is affected and how much is at risk?**

Tools and knowledge sources:

- `calculate_supplier_impact` or `get_supplier_impact`
- Supplier, material, BOM, product, plant, and customer-order records in the digital twin
- Inventory consumption and coverage calculations
- Optional future connectors to ERP, MRP, inventory, and order-management systems

Outputs:

- Affected materials and stockout timing
- Lead-time gap and inventory coverage
- Affected components, products, plants, and customer orders
- Revenue and margin at risk
- SLA impact and root-cause summary

#### Simulation Agent

The Simulation Agent answers: **Which response options are available, and what does each one cost?**

Tools and knowledge sources:

- `simulate_strategies` or `compare_recovery_strategies`
- Deterministic scenario engine
- Freight, capacity, inventory, lead-time, and cost assumptions
- Optional future supplier-capacity and transportation APIs

The current prototype compares:

1. Do nothing
2. Expedite the primary supplier
3. Reallocate inventory between plants
4. Use an alternate supplier
5. Reschedule and prioritize production

Outputs:

- Revenue protected and remaining revenue at risk
- Additional cost and net benefit
- Expected delay and orders saved
- Customer SLA risk
- Feasibility score, implementation time, and trade-offs

#### Recovery Agent

The Recovery Agent answers: **What action plan should the business approve?**

Tools and knowledge sources:

- Recovery-policy rules and approval thresholds
- Procurement guidelines
- Supplier contracts and authorized clauses
- Simulation results from the Simulation Agent
- Approved supplier and purchase-order systems in a production deployment

Outputs:

- Recommended strategy or hybrid plan
- Ordered actions with owners and deadlines
- Financial exposure and expected protection
- Required approval role
- Evidence references and execution preconditions

#### Human Approval Service

The approval service is intentionally outside the model's authority. It checks the user's role, records the decision, and only then permits execution. In the current scenario, the plan pauses when its operational expenditure exceeds the autonomous execution threshold. A supply-chain manager or executive can approve or reject the plan through the Recovery Command view.

### Why multi-agent is better than one agent

A single general-purpose agent would have to reason about graph traversal, numerical simulation, contracts, procurement policy, and authorization in one context. That increases the risk of ungrounded calculations, unclear ownership, oversized prompts, and difficult debugging.

The multi-agent design provides:

- **Separation of concerns:** each agent has a narrow objective and tool set.
- **Grounding:** decision-critical figures are returned by deterministic tools.
- **Testability:** each specialist can be evaluated independently.
- **Explainability:** every stage emits a structured input, output, tool call, and status.
- **Governance:** the Recovery Agent can recommend, but the approval service controls execution.
- **Extensibility:** new specialists, such as a logistics or customer-communications agent, can be added without rewriting the impact engine.

## 3. End-to-End Workflow

```mermaid
sequenceDiagram
    actor User as Supply-chain user
    participant UI as Control tower
    participant O as Orchestrator
    participant I as Impact Agent
    participant D as Digital twin and impact tools
    participant S as Simulation Agent
    participant E as Simulation engine
    participant R as Recovery Agent
    participant K as Policies and contracts
    participant H as Human approval
    participant A as Audit and telemetry

    User->>UI: Select disruption scenario
    UI->>O: Event ID, supplier ID, duration, user context
    O->>A: Start correlation trace
    O->>I: Structured disruption case
    I->>D: Retrieve supplier, inventory, BOM, plant, order data
    D-->>I: Impact totals and affected entities
    I->>A: Record tool call, evidence, latency, result
    I-->>O: Impact package
    O->>S: Impact package and scenario assumptions
    S->>E: Compare recovery strategies
    E-->>S: Cost, protection, delay, SLA risk, feasibility
    S->>A: Record simulation inputs and outputs
    S-->>O: Ranked strategy options
    O->>R: Impact package plus simulation results
    R->>K: Retrieve approval rules, contracts, and procurement policy
    K-->>R: Authorized actions and thresholds
    R-->>O: Recovery plan and required approval role
    O->>H: Submit plan for human decision
    H-->>UI: Show evidence and approval controls
    User->>UI: Approve or reject plan
    UI->>H: User identity, role, decision
    H->>A: Record decision and execution status
    H-->>UI: Approved execution or rejection outcome
```

### Information contract between agents

Each handoff is a structured object rather than free-form prose:

```json
{
  "correlation_id": "CASE-2026-042",
  "event_id": "EVT-2026-042",
  "supplier_id": "SUP-042",
  "disruption_days": 14,
  "severity": "CRITICAL",
  "impact": {
    "revenue_at_risk": "tool output",
    "inventory_coverage_days": "tool output",
    "affected_plants": "tool output",
    "customer_orders_at_risk": "tool output"
  },
  "simulation": {
    "strategies": "tool output",
    "recommended_strategy": "tool output"
  },
  "approval": {
    "required_role": "SUPPLY_CHAIN_MANAGER",
    "financial_threshold": 100000
  }
}
```

The real implementation should use a versioned schema with explicit units, currency, timestamps, source references, confidence or completeness flags, and validation errors. Numeric values must remain typed numbers in the internal contract even when rendered as formatted text in the UI.

### Final business output

The user receives:

1. A concise disruption summary and root cause.
2. Quantified operational and financial impact.
3. A comparison of recovery strategies and trade-offs.
4. A recommended recovery plan with action owners, cost, expected protection, and timing.
5. A clear approval request when the action is outside autonomous authority.
6. A trace and audit reference that supports later review.

## 4. Production-Readiness Plan

### 4.1 Observability strategy

The system should emit correlated traces across the browser, API, orchestrator, specialist agents, model calls, tools, knowledge retrieval, approval service, and downstream execution systems. Microsoft Foundry tracing and Application Insights can provide the central operational view.

#### Trace attributes

Every request should carry:

- `correlation_id`, `event_id`, and `scenario_id`
- Agent name, agent version, prompt or instruction version
- Model deployment, region, and request mode
- Tool name, validated arguments, source system, and result status
- Retrieval index, document IDs, and relevance scores where applicable
- Token counts, model latency, tool latency, end-to-end latency
- Approval role, decision, execution status, and policy version
- Redaction status and data classification

Sensitive payloads should be masked or stored as hashed references. Full prompts and outputs should only be retained where policy permits.

#### Operational metrics

| Metric | Why it matters | Example alert or review |
| --- | --- | --- |
| End-to-end response latency | Detects slow user experience or downstream dependency issues | P95 above the agreed target |
| Tool success and timeout rate | Shows whether the agent can access authoritative data | Repeated impact-tool failures |
| Model error and retry rate | Identifies capacity, authentication, or prompt problems | Sudden increase after deployment |
| Grounded answer rate | Measures whether outputs cite available tool or knowledge evidence | Sampled responses without evidence |
| Recovery-plan acceptance rate | Indicates whether recommendations are useful to operators | Fall after a policy or prompt change |
| Approval-to-execution failure rate | Detects unsafe or incomplete handoffs | Any approved action that cannot execute |
| Evaluation score by agent version | Detects quality regressions | Regression gate in CI/CD |
| Cost per case and token usage | Controls operating cost | Budget threshold by environment |
| Safety and policy violation rate | Protects against unsafe recommendations or data leakage | Immediate incident workflow |

#### How observability improves the solution

Traces let an engineer distinguish a bad model response from a bad tool result, stale knowledge, a slow connector, or an authorization failure. Comparing latency and quality by agent version supports targeted improvements instead of changing the entire workflow. Production traces can also be sampled into a reviewed evaluation dataset, with privacy controls and human labeling.

### 4.2 Evaluation strategy

Evaluation must cover both the specialist agents and the complete business outcome. A response that sounds coherent but uses the wrong inventory figure is a failure.

#### Evaluation dataset

Create a versioned dataset with representative, synthetic cases covering:

- Short, medium, and severe supplier delays
- Multiple affected materials and plants
- No affected downstream orders
- Missing supplier or stale inventory data
- Conflicting contract clauses
- Alternate supplier unavailable
- Costs above and below the approval threshold
- Ambiguous user requests
- Prompt injection inside a retrieved document
- Requests for confidential or unauthorized information

Each record should include the event input, expected tool calls, authoritative expected values, acceptable recommendation characteristics, required approval behavior, and a human-written rationale.

#### Evaluation criteria

| Criterion | What good looks like |
| --- | --- |
| Relevance | Addresses the stated disruption and user role without unrelated content |
| Groundedness | Numeric claims and recommendations are supported by tool outputs or approved knowledge |
| Task adherence | Completes impact, comparison, recommendation, and approval steps in order |
| Tool usage | Calls the correct tools with valid arguments and does not calculate protected figures from memory |
| Coherence | Explains causal links from supplier event to business impact |
| Safety | Refuses unsafe or unauthorized execution and handles prompt injection defensively |
| Fluency | Produces clear, concise language appropriate for operations users |
| Policy adherence | Applies financial thresholds, role permissions, and data-handling rules consistently |
| Workflow correctness | Preserves the required handoff schema and correlation ID |

Use deterministic assertions for tool arguments, expected totals, approval gates, and schema validity. Use model-assisted or human grading for coherence, relevance, and explanation quality. Keep a small gold set for release gates and a broader regression set for scheduled evaluation.

#### Development lifecycle integration

1. **Pull request:** run unit tests, schema checks, tool-contract tests, and a small smoke evaluation.
2. **Pre-deployment:** run the full regression suite against the candidate agent version and compare it with the current version.
3. **Deployment:** use a staged environment and a small canary population.
4. **Production:** monitor quality, safety, latency, cost, and tool failures.
5. **Continuous improvement:** sample low-confidence, rejected, failed, and high-impact cases for review.
6. **Release decision:** promote only when quality improves or remains within agreed tolerances and no critical safety or policy regression is present.

### 4.3 Governance, reliability, and maintainability

#### Consistent and safe behavior

- Keep the system prompt explicit about tool-first behavior and uncertainty.
- Require structured outputs and validate every agent handoff.
- Make tools authoritative for quantities, costs, dates, and business status.
- Use allowlisted tools with least-privilege managed identities.
- Apply role-based access control to investigation, approval, and execution operations.
- Enforce approval thresholds in code, not only in instructions.
- Add idempotency keys to execution actions so retries cannot create duplicate purchase orders.
- Add timeouts, retries with backoff, circuit breakers, and clear fallback states for external systems.
- Preserve human control for high-value, irreversible, or customer-facing actions.
- Log model, prompt, tool, policy, and knowledge versions with every decision.

#### Knowledge grounding

Knowledge sources should contain approved supplier contracts, procurement policies, escalation rules, plant operating constraints, and definitions of financial or service-level terms. Retrieval should return document IDs, effective dates, section references, and access checks. The Recovery Agent must not treat an untrusted document as an instruction to bypass policy or execute an action.

#### Reliability boundaries

The current prototype uses deterministic in-memory data and simulation logic. A production implementation would add:

- Durable storage for cases, plans, audit records, and approvals
- Versioned digital-twin snapshots and data freshness checks
- Connectors to ERP, MRP, inventory, supplier, logistics, and order systems
- Contract and policy indexing with document lifecycle management
- Dead-letter handling for failed events
- Disaster recovery and regional deployment strategy
- Separate development, test, staging, and production Foundry projects
- Automated deployment with rollback and prompt/instruction versioning
- Cost budgets, quota monitoring, and model fallback policy

## 5. Current Prototype Mapping

| Course concept | Evidence in this repository |
| --- | --- |
| Specialised agents | Orchestrator, Impact Agent, Simulation Agent, and Recovery Agent traces |
| Tools | Supplier impact, strategy comparison, deterministic simulation, approval endpoints |
| Knowledge and data grounding | Digital twin entities, policy references, contract references, typed tool outputs |
| Human-in-the-loop | Recovery Command approval and rejection flow |
| Observability | Agent Trace view, real tool latency, status, input/output payloads, and reasoning notes |
| Governance | Approval threshold, role checks, audit log, execution status |
| Microsoft Foundry hosting | `azure.yaml` defines the project, model deployment, and hosted Python agent |
| Evaluation foundation | Backend tests for agent, impact, simulation, workflow, and connection behavior |

The prototype is deliberately honest about its boundary: it demonstrates the workflow with deterministic local data and can call a Foundry model through the Responses protocol, but it is not yet a complete enterprise integration with live ERP, policy retrieval, production identity, or continuous evaluation infrastructure.

## 6. Deployment And Improvement Roadmap

### Phase 1: Prototype

- Demonstrate the disruption scenario with synthetic data.
- Validate the agent-to-tool loop and user workflow.
- Capture traces and audit records.
- Test the core deterministic calculations.

### Phase 2: Controlled pilot

- Connect read-only ERP, MRP, and inventory sources.
- Add document retrieval for approved contracts and policies.
- Introduce Entra ID, managed identities, RBAC, and environment separation.
- Establish the evaluation dataset and release thresholds.
- Keep all execution actions behind human approval.

### Phase 3: Production

- Add durable case and audit storage.
- Add event-driven disruption ingestion and resilient connectors.
- Integrate approved purchase-order, logistics, and customer-communications actions.
- Enable continuous monitoring and evaluation with privacy-preserving trace sampling.
- Run canary deployments, rollback procedures, incident response, and periodic access reviews.

### Phase 4: Optimization

- Use accepted and rejected recommendations to improve policies and prompts.
- Add specialist agents only when a distinct responsibility and evaluation boundary exist.
- Tune model selection by task complexity, latency, quality, and cost.
- Add scenario forecasting and proactive risk detection after the response workflow is reliable.

## 7. Short Presentation Plan

A five-to-seven-minute recording can follow this sequence:

1. **Business problem, 45 seconds:** Explain why a supplier delay must be traced across materials, plants, products, and customer orders.
2. **Solution overview, 60 seconds:** Show the control tower and the multi-agent architecture.
3. **Live scenario, 2 minutes:** Open the disruption, show the impact analysis, and compare recovery simulations.
4. **Human approval, 60 seconds:** Show why the plan pauses at the financial threshold and how an authorized user approves or rejects it.
5. **Production readiness, 90 seconds:** Explain traces, evaluation datasets, metrics, knowledge grounding, RBAC, and reliability controls.
6. **Reflection, 45 seconds:** Describe how the design moves beyond a chatbot by grounding calculations, separating responsibilities, measuring quality, and keeping humans accountable for material decisions.

Recommended visuals:

- Control Tower view with the disruption selected
- Impact or Investigation view showing the downstream network
- Simulation Lab comparison
- Recovery Command approval gate
- Agent Trace view
- Audit Log view
- Architecture or sequence diagram from this document

Do not display real supplier names, personal information, credentials, internal contract text, customer data, unredacted traces, or screenshots of restricted systems. Use the synthetic scenario in this repository for the recording.

## Conclusion

SupplyChain Nexus demonstrates a practical path from a prototype idea to a production-ready enterprise AI architecture. The model is useful because it coordinates work and explains results, but the system remains trustworthy because the calculations are tool-grounded, the workflow is observable, the quality is measurable, and high-impact actions remain subject to explicit human authorization.
