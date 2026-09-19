import React from 'react';
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Package,
  Building2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Radio,
  MapPin,
  Clock,
  Compass,
} from 'lucide-react';
import { SupplyChainEvent } from '../types/index.js';

interface ControlTowerViewProps {
  dashboardData: any;
  onNavigateToInvestigation: (eventId: string) => void;
  onNavigateToSimulation: () => void;
  onNavigateToDisruptions: () => void;
}

export const ControlTowerView: React.FC<ControlTowerViewProps> = ({
  dashboardData,
  onNavigateToInvestigation,
  onNavigateToSimulation,
  onNavigateToDisruptions,
}) => {
  const isApproved = dashboardData?.is_plan_approved;
  const healthScore = dashboardData?.supply_chain_health || (isApproved ? 94 : 72);
  const revenueAtRisk = dashboardData?.revenue_at_risk || (isApproved ? 80000 : 4200000);
  const ordersAtRisk = dashboardData?.orders_at_risk || (isApproved ? 5 : 127);
  const activeDisruptionsCount = dashboardData?.active_disruptions_count || 3;
  const plantsImpacted = dashboardData?.plants_impacted_count || (isApproved ? 1 : 3);

  // Global Facilities for the interactive network map
  const facilities = [
    { id: 'f1', name: 'Apex Micro-Foundry (SUP-042)', type: 'SUPPLIER', location: 'Hsinchu, Taiwan', x: 74, y: 48, status: isApproved ? 'RESOLVED' : 'DISRUPTED', impact: '14-Day Delay' },
    { id: 'f2', name: 'Kyoto Precision (SUP-118)', type: 'ALTERNATE', location: 'Kyoto, Japan', x: 79, y: 41, status: isApproved ? 'ACTIVE_BACKUP' : 'STANDBY', impact: 'Lead Time 3d' },
    { id: 'f3', name: 'PLANT-03 Stuttgart Assembly', type: 'PLANT', location: 'Stuttgart, Germany', x: 49, y: 32, status: isApproved ? 'OPERATIONAL' : 'STARVATION_RISK', impact: '58 Orders' },
    { id: 'f4', name: 'PLANT-07 Detroit Heavy Works', type: 'PLANT', location: 'Detroit, USA', x: 25, y: 34, status: isApproved ? 'OPERATIONAL' : 'STARVATION_RISK', impact: '44 Orders' },
    { id: 'f5', name: 'PLANT-11 Yokohama Mechatronics', type: 'PLANT', location: 'Yokohama, Japan', x: 82, y: 42, status: 'OPERATIONAL', impact: '25 Orders' },
    { id: 'f6', name: 'PLANT-05 Munich Buffer Hub', type: 'WAREHOUSE', location: 'Munich, Germany', x: 51, y: 33, status: isApproved ? 'DISPATCHING' : 'READY', impact: '4,200 Units Buffer' },
    { id: 'f7', name: 'Port of Rotterdam Terminal 4', type: 'PORT', location: 'Rotterdam, Netherlands', x: 48, y: 30, status: 'CONGESTED', impact: '6-Day Dwell' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Status Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${isApproved ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className={`p-2.5 rounded-xl ${isApproved ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'}`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Global Operations Monitor</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isApproved ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                  {isApproved ? 'MITIGATION PROTOCOL ACTIVE' : 'ACTIVE CRITICAL DISRUPTION DETECTED'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                {isApproved
                  ? 'Plan REC-PLAN-2026-042 Approved: Alternate sourcing & buffer release running. Residual risk: $80K.'
                  : 'Supplier SUP-042 (Apex Micro-Foundry) reports 14-day production halt. $4.2M revenue exposed.'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToInvestigation('EVT-2026-042')}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Investigate Cascade <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToSimulation}
              className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors shadow-sm"
            >
              Simulate Strategies
            </button>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Supply Chain Health */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Network Health</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{healthScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
          <div className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1 ${isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isApproved ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isApproved ? '+22 pts recovered' : '-18 pts due to SUP-042'}
          </div>
        </div>

        {/* KPI 2: Revenue at Risk */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Revenue Exposure</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-black ${isApproved ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${(revenueAtRisk / 1000000).toFixed(2)}M
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 font-medium">
            {isApproved ? '$4.12M protected' : '127 Orders directly affected'}
          </div>
        </div>

        {/* KPI 3: Orders at Risk */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Orders at Risk</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{ordersAtRisk}</div>
          <div className="mt-1.5 text-[11px] text-slate-500 font-medium">
            {isApproved ? 'Tier-1 SLAs 100% saved' : 'Boeing & Siemens delayed'}
          </div>
        </div>

        {/* KPI 4: Active Disruptions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Disruptions</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeDisruptionsCount}</div>
          <div className="mt-1.5 text-[11px] text-rose-600 font-semibold">
            1 Critical, 1 High, 1 Med
          </div>
        </div>

        {/* KPI 5: Supplier Risk */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Peak Supplier Risk</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">84 <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
          <div className="mt-1.5 text-[11px] text-slate-500 font-medium">
            SUP-042 Litho Cleanroom
          </div>
        </div>

        {/* KPI 6: Plants Impacted */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Plants Impacted</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{plantsImpacted} <span className="text-xs text-slate-400 font-normal">/ 4</span></div>
          <div className="mt-1.5 text-[11px] text-slate-500 font-medium">
            Stuttgart, Detroit, Yokohama
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Network Map + Live EDI Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Supply Chain Digital Twin Visualization */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                Global Manufacturing & Logistics Topology
              </h3>
              <p className="text-xs text-slate-500">Interactive telemetry across fabrication sites, assembly plants, and maritime corridors</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              7 Monitored Nodes
            </span>
          </div>

          {/* Stylized World Network Canvas */}
          <div className="relative w-full h-80 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* World Map Graticule Grid */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Curved connection arcs (coordinates are percentages of the 0-100 viewBox) */}
              <path d="M 74 48 Q 62 28 49 32" fill="none" stroke="#ef4444" strokeWidth="0.3" strokeDasharray="1.2 1.2" className="animate-pulse" />
              <path d="M 74 48 Q 50 20 25 34" fill="none" stroke="#ef4444" strokeWidth="0.25" strokeDasharray="1 1" />
              <path d="M 79 41 Q 65 25 49 32" fill="none" stroke="#10b981" strokeWidth="0.3" />
              <path d="M 51 33 L 49 32" stroke="#3b82f6" strokeWidth="0.5" />
            </svg>

            {/* Nodes pinned on map */}
            {facilities.map((fac) => (
              <div
                key={fac.id}
                className="absolute group -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                style={{ left: `${fac.x}%`, top: `${fac.y}%` }}
                onClick={() => fac.id === 'f1' && onNavigateToInvestigation('EVT-2026-042')}
              >
                {/* Glowing status ring */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border-2 border-white transition-all transform group-hover:scale-125 ${
                    fac.status === 'DISRUPTED'
                      ? 'bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-ping'
                      : fac.status === 'STARVATION_RISK'
                      ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                      : fac.status === 'ACTIVE_BACKUP' || fac.status === 'RESOLVED'
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                      : 'bg-blue-500'
                  }`}
                />
                {/* Node Label Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 top-5 whitespace-nowrap bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-white rounded-md px-2 py-1 shadow-lg pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="text-[10px] font-bold">{fac.name}</div>
                  <div className="text-[9px] text-slate-300 flex items-center justify-between gap-2">
                    <span>{fac.location}</span>
                    <span className="font-semibold text-amber-400">{fac.impact}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-lg p-2 flex items-center gap-4 text-[10px] text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Disrupted Node</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Starvation Risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Alternate Source / Buffer</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Assembly Plant</span>
            </div>
          </div>

          {/* Plant Utilization Summary */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-left">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">PLANT-03 Stuttgart</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Turbines & Controllers</div>
              <div className="text-[11px] text-rose-600 font-medium mt-1">Buffer: 5.2 Days Runway</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">PLANT-07 Detroit</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Heavy Robotic Welders</div>
              <div className="text-[11px] text-rose-600 font-medium mt-1">Buffer: 5.2 Days Runway</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">PLANT-05 Munich Hub</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Central Logistics Buffer</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">4,200 Units Ready to Transfer</div>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry & Disruption Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-600" />
                  Active Disruption Feed
                </h3>
                <p className="text-xs text-slate-500">Live EDI-855, AIS & supplier sensors</p>
              </div>
              <button
                onClick={onNavigateToDisruptions}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                All (7) <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alert Item 1: Championship SUP-042 */}
            <div
              onClick={() => onNavigateToInvestigation('EVT-2026-042')}
              className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-50 cursor-pointer transition-colors space-y-1.5 mb-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">CRITICAL</span>
                <span className="text-[10px] text-slate-500 font-mono">EVT-2026-042</span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-snug">
                SUP-042 Apex Micro-Foundry: 14-Day Delay
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2">
                Cleanroom photolithography sensor failure in Hsinchu. Halts silicon wafer MAT-1007.
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] font-semibold">
                <span className="text-rose-700">$4.2M Revenue Exposure</span>
                <span className="text-blue-700 flex items-center gap-1">
                  Investigate <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Alert Item 2: Rotterdam Port */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors space-y-1 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">HIGH</span>
                <span className="text-[10px] text-slate-400 font-mono">EVT-2026-003</span>
              </div>
              <div className="text-xs font-bold text-slate-800">Port of Rotterdam Container Congestion</div>
              <p className="text-[11px] text-slate-500">6-day dwell increase on titanium raw material feeder line.</p>
              <div className="text-[10px] text-slate-600 font-medium">$1.85M Buffer Cushion</div>
            </div>

            {/* Alert Item 3: Trans-Pacific Typhoon */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">RESOLVED</span>
                <span className="text-[10px] text-slate-400 font-mono">EVT-2026-008</span>
              </div>
              <div className="text-xs font-bold text-slate-800">Typhoon Shanshan Vessel Diversion</div>
              <p className="text-[11px] text-slate-500">Trans-Pacific ships rerouted south; transit normalized.</p>
            </div>
          </div>

          {/* Quick Trigger Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateToInvestigation('EVT-2026-042')}
              className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
            >
              Start Hero Disruption Walkthrough (SUP-042) <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
