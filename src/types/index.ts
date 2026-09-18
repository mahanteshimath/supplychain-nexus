// SupplyChain Nexus — Core TypeScript Types & Digital Twin Schemas

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DisruptionStatus = 'INVESTIGATING' | 'SIMULATING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'MONITORING';
export type ApprovalStatus = 'PROPOSED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
export type ActionExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface Supplier {
  supplier_id: string;
  supplier_name: string;
  country: string;
  region: string;
  city: string;
  supplier_type: string;
  risk_score: number; // 0-100
  capacity_score: number; // 0-100
  quality_score: number; // 0-100
  financial_score: number; // 0-100
  lead_time_days: number;
  annual_spend: number;
  active_flag: boolean;
  latitude: number;
  longitude: number;
}

export interface SupplierSite {
  supplier_site_id: string;
  supplier_id: string;
  site_name: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  lead_time_days: number;
  risk_score: number;
  active_flag: boolean;
}

export interface Material {
  material_id: string;
  material_name: string;
  material_category: string;
  material_type: string;
  unit_cost: number;
  unit_of_measure: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lead_time_days: number;
  safety_stock: number;
  minimum_order_qty: number;
  primary_supplier_id: string;
  alternate_supplier_id?: string;
  available_inventory: number;
  reserved_inventory: number;
  daily_consumption_rate: number;
}

export interface Product {
  product_id: string;
  product_name: string;
  product_family: string;
  product_category: string;
  unit_price: number;
  standard_cost: number;
  margin: number;
  production_time_hours: number;
  criticality: 'STANDARD' | 'HIGH' | 'MISSION_CRITICAL';
  active_flag: boolean;
}

export interface BOMItem {
  bom_id: string;
  product_id: string;
  parent_item_id: string;
  component_item_id: string;
  component_name: string;
  component_type: 'COMPONENT' | 'RAW_MATERIAL' | 'SUB_ASSEMBLY';
  quantity_required: number;
  scrap_factor: number;
  effective_from: string;
  effective_to?: string;
}

export interface Plant {
  plant_id: string;
  plant_name: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  plant_type: string;
  capacity_units: number;
  current_utilization: number;
  operating_cost_per_hour: number;
  active_flag: boolean;
}

export interface ProductionLine {
  line_id: string;
  plant_id: string;
  line_name: string;
  product_family: string;
  capacity_units_per_day: number;
  setup_time_hours: number;
  utilization: number;
  active_flag: boolean;
}

export interface Warehouse {
  warehouse_id: string;
  plant_id: string;
  warehouse_name: string;
  warehouse_type: string;
  capacity: number;
  country: string;
  region: string;
}

export interface Customer {
  customer_id: string;
  customer_name: string;
  industry: string;
  country: string;
  region: string;
  city: string;
  customer_tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
  sla_days: number;
  annual_revenue: number;
}

export interface Carrier {
  carrier_id: string;
  carrier_name: string;
  carrier_type: 'AIR' | 'OCEAN' | 'RAIL' | 'ROAD';
  region: string;
  reliability_score: number;
  average_transit_days: number;
}

export interface Route {
  route_id: string;
  origin_type: string;
  origin_id: string;
  destination_type: string;
  destination_id: string;
  distance_km: number;
  transit_days: number;
  risk_score: number;
}

export interface PurchaseOrder {
  po_id: string;
  supplier_id: string;
  supplier_site_id: string;
  plant_id: string;
  po_date: string;
  expected_date: string;
  actual_date?: string;
  status: 'ISSUED' | 'CONFIRMED' | 'DELAYED' | 'EXPEDITED' | 'RECEIVED';
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  total_value: number;
}

export interface PurchaseOrderLine {
  po_line_id: string;
  po_id: string;
  material_id: string;
  ordered_qty: number;
  received_qty: number;
  unit_cost: number;
  expected_date: string;
  actual_date?: string;
  status: string;
}

export interface InventoryItem {
  inventory_id: string;
  plant_id: string;
  warehouse_id: string;
  material_id: string;
  available_qty: number;
  reserved_qty: number;
  safety_stock: number;
  in_transit_qty: number;
  inventory_date: string;
}

export interface ProductionOrder {
  production_order_id: string;
  plant_id: string;
  line_id: string;
  product_id: string;
  planned_quantity: number;
  completed_quantity: number;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  priority: 'STANDARD' | 'HIGH' | 'CRITICAL';
  status: 'SCHEDULED' | 'RUNNING' | 'HALTED' | 'DELAYED' | 'COMPLETED';
}

export interface ProductionConsumption {
  consumption_id: string;
  production_order_id: string;
  material_id: string;
  required_qty: number;
  consumed_qty: number;
  shortage_qty: number;
}

export interface CustomerOrder {
  customer_order_id: string;
  customer_id: string;
  customer_name: string;
  customer_tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
  plant_id: string;
  order_date: string;
  requested_date: string;
  promised_date: string;
  priority: 'NORMAL' | 'HIGH' | 'EXPEDITE';
  status: 'CONFIRMED' | 'IN_PRODUCTION' | 'AT_RISK' | 'DELAYED' | 'DELIVERED';
  total_revenue: number;
}

export interface CustomerOrderLine {
  customer_order_line_id: string;
  customer_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  revenue: number;
  requested_date: string;
  promised_date: string;
}

export interface Shipment {
  shipment_id: string;
  source_type: string;
  source_id: string;
  destination_type: string;
  destination_id: string;
  carrier_id: string;
  route_id: string;
  ship_date: string;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  quantity: number;
  status: 'IN_TRANSIT' | 'DELAYED' | 'DELIVERED' | 'HELD';
  delay_days: number;
}

export interface SupplierPerformance {
  performance_id: string;
  supplier_id: string;
  evaluation_date: string;
  on_time_rate: number;
  quality_rate: number;
  fill_rate: number;
  average_delay_days: number;
  defect_rate: number;
  risk_score: number;
}

export interface SupplierContract {
  contract_id: string;
  supplier_id: string;
  material_id: string;
  contract_start: string;
  contract_end: string;
  agreed_price: number;
  minimum_commitment: number;
  maximum_capacity: number;
  penalty_rate: number;
  expedite_available: boolean;
  alternate_source_allowed: boolean;
  notes?: string;
}

export interface SupplyChainEvent {
  event_id: string;
  event_type:
    | 'SUPPLIER_DELAY'
    | 'SUPPLIER_FAILURE'
    | 'PORT_CLOSURE'
    | 'FACTORY_SHUTDOWN'
    | 'TRANSPORT_DELAY'
    | 'DEMAND_SPIKE'
    | 'RAW_MATERIAL_SHORTAGE'
    | 'QUALITY_FAILURE'
    | 'WEATHER_DISRUPTION'
    | 'GEOPOLITICAL_EVENT'
    | 'PRICE_INCREASE'
    | 'COMPOUND_DISRUPTION';
  event_date: string;
  entity_type: 'SUPPLIER' | 'PORT' | 'PLANT' | 'ROUTE' | 'CARRIER';
  entity_id: string;
  entity_name: string;
  severity: SeverityLevel;
  duration_days: number;
  probability: number;
  description: string;
  source: string;
  status: DisruptionStatus;
  estimated_revenue_impact: number;
  affected_materials: string[];
  affected_products: string[];
  affected_plants: string[];
}

export interface ScenarioDefinition {
  scenario_id: string;
  code: string;
  name: string;
  description: string;
  target_entity: string;
  duration_days: number;
  severity: SeverityLevel;
  parameters: {
    supplier_id?: string;
    plant_id?: string;
    delay_days?: number;
    capacity_drop_pct?: number;
    demand_spike_pct?: number;
  };
}

export interface ImpactAnalysisResult {
  disruption_event_id: string;
  supplier_id: string;
  supplier_name: string;
  disruption_duration_days: number;
  severity: SeverityLevel;
  revenue_at_risk: number;
  margin_at_risk: number;
  customer_orders_at_risk: number;
  affected_customer_orders: CustomerOrder[];
  affected_materials: {
    material_id: string;
    material_name: string;
    available_qty: number;
    daily_consumption: number;
    coverage_days: number;
    stockout_day: number;
    criticality: string;
  }[];
  affected_components: {
    component_id: string;
    component_name: string;
    required_material_id: string;
  }[];
  affected_products: {
    product_id: string;
    product_name: string;
    unit_price: number;
    affected_margin: number;
  }[];
  affected_plants: {
    plant_id: string;
    plant_name: string;
    production_orders_impacted: number;
    location: string;
  }[];
  inventory_coverage_days: number;
  lead_time_gap_days: number;
  sla_impact: {
    orders_at_risk: number;
    orders_delayed: number;
    average_delay_days: number;
    maximum_delay_days: number;
    tier_1_orders_delayed: number;
  };
  root_cause_summary: string;
}

export interface SimulationStrategyResult {
  strategy_id: string;
  strategy_name: 'DO_NOTHING' | 'EXPEDITE' | 'REALLOCATE' | 'ALTERNATE_SUPPLIER' | 'RESCHEDULE' | 'RECOMMENDED_HYBRID';
  display_title: string;
  description: string;
  revenue_protected: number;
  revenue_at_risk: number;
  additional_cost: number;
  net_benefit: number;
  delay_days: number;
  orders_saved: number;
  orders_delayed: number;
  customer_sla_risk: number; // 0-1
  feasibility_score: number; // 0-100
  implementation_time_days: number;
  key_trade_offs: string[];
  actions_required: string[];
  details: Record<string, any>;
}

export interface RecoveryPlan {
  plan_id: string;
  event_id: string;
  created_at: string;
  proposed_by_agent: string;
  approval_status: ApprovalStatus;
  approved_by_user?: string;
  approval_timestamp?: string;
  total_revenue_exposure: number;
  total_revenue_protected: number;
  total_additional_cost: number;
  orders_protected: number;
  orders_delayed: number;
  projected_delay_days: number;
  recommended_strategy: string;
  executive_summary: string;
  actions: RecoveryActionItem[];
}

export interface RecoveryActionItem {
  action_id: string;
  action_type: 'ACTIVATE_ALTERNATE_SUPPLIER' | 'EXPEDITE_PO' | 'TRANSFER_INVENTORY' | 'RESCHEDULE_PRODUCTION' | 'NOTIFY_TIER1_CUSTOMERS';
  title: string;
  description: string;
  target_entity: string;
  estimated_cost: number;
  status: ActionExecutionStatus;
  execution_result?: string;
  document_ref?: string;
}

export interface AgentTraceRecord {
  step_id: string;
  agent_name: 'Orchestrator' | 'Impact Agent' | 'Simulation Agent' | 'Recovery Agent' | 'Action Agent';
  tool_name: string;
  timestamp: string;
  duration_ms: number;
  status: 'SUCCESS' | 'RUNNING' | 'ERROR';
  input_payload: Record<string, any>;
  output_payload: Record<string, any>;
  reasoning_note: string;
}

export interface AuditLogEntry {
  log_id: string;
  timestamp: string;
  event_id: string;
  action_title: string;
  action_type: string;
  requested_by_agent: string;
  approved_by_user: string;
  user_role: string;
  approval_status: ApprovalStatus;
  execution_status: ActionExecutionStatus;
  result_summary: string;
  document_reference: string;
}
