import React, { useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Calendar,
  Building,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { nodeTypes } from './NetworkNodes.js';
import { ImpactAnalysisResult } from '../types/index.js';

interface InvestigationViewProps {
  eventId: string;
  onNavigateToSimulation: () => void;
  onNavigateToRecovery: () => void;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  eventId,
  onNavigateToSimulation,
  onNavigateToRecovery,
}) => {
  const [impactData, setImpactData] = useState<ImpactAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Graph Elements for React Flow
  const initialNodes = [
    {
      id: 'sup-042',
      type: 'supplierNode',
      position: { x: 30, y: 140 },
      data: {
        label: 'Apex Micro-Foundry (SUP-042)',
        sublabel: 'Fab 3 — Hsinchu Science Park, Taiwan',
        entity_id: 'SUP-042',
        risk_score: 84,
        lead_time: '28d (+14d Delay)',
      },
    },
    {
      id: 'mat-1007',
      type: 'materialNode',
      position: { x: 300, y: 60 },
      data: {
        label: 'MAT-1007: Silicon Sensor Substrate',
        sublabel: 'Wafer (8-inch GaN-ready)',
        entity_id: 'MAT-1007',
        coverage: '5.2 Days Runway',
        stockout: 'Day 5.2 Stockout',
      },
    },
    {
      id: 'mat-1012',
      type: 'materialNode',
      position: { x: 300, y: 250 },
      data: {
        label: 'MAT-1012: GaN Power Switching Die',
        sublabel: 'Power Electronics Module',
        entity_id: 'MAT-1012',
        coverage: '5.2 Days Runway',
        stockout: 'Day 5.2 Stockout',
      },
    },
    {
      id: 'comp-204',
      type: 'componentNode',
      position: { x: 580, y: 60 },
      data: {
        label: 'COMP-204: Optoelectronic MCU',
        sublabel: 'Requires MAT-1007 & Optical Bus',
        entity_id: 'COMP-204',
      },
    },
    {
      id: 'comp-205',
      type: 'componentNode',
      position: { x: 580, y: 250 },
      data: {
        label: 'COMP-205: HV Power Inverter',
        sublabel: 'Requires MAT-1012 & Thermal Shield',
        entity_id: 'COMP-205',
      },
    },
    {
      id: 'prod-5001',
      type: 'productNode',
      position: { x: 860, y: 40 },
      data: {
        label: 'PROD-5001: NexTurbine 9000',
        sublabel: '$85,000 / unit | Margin 38%',
        entity_id: 'PROD-5001',
      },
    },
    {
      id: 'prod-5004',
      type: 'productNode',
      position: { x: 860, y: 170 },
      data: {
        label: 'PROD-5004: NexDrive Servo Controller',
        sublabel: '$34,000 / unit | Margin 42%',
        entity_id: 'PROD-5004',
      },
    },
    {
      id: 'prod-5012',
      type: 'productNode',
      position: { x: 860, y: 300 },
      data: {
        label: 'PROD-5012: RoboWeld Core Welder',
        sublabel: '$52,000 / unit | Margin 35%',
        entity_id: 'PROD-5012',
      },
    },
    {
      id: 'plant-03',
      type: 'plantNode',
      position: { x: 1140, y: 80 },
      data: {
        label: 'PLANT-03: Stuttgart Assembly',
        sublabel: 'Final Integration | 58 Orders Stalled',
        entity_id: 'PLANT-03',
      },
    },
    {
      id: 'plant-07',
      type: 'plantNode',
      position: { x: 1140, y: 240 },
      data: {
        label: 'PLANT-07: Detroit Heavy Works',
        sublabel: 'Robotic Line | 44 Orders Stalled',
        entity_id: 'PLANT-07',
      },
    },
    {
      id: 'cust-boeing',
      type: 'customerNode',
      position: { x: 1410, y: 50 },
      data: {
        label: 'Boeing Commercial Airplanes',
        sublabel: 'Tier-1 | $1.2M Exposure | SLA 2d',
        entity_id: 'ORD-900123',
      },
    },
    {
      id: 'cust-siemens',
      type: 'customerNode',
      position: { x: 1410, y: 170 },
      data: {
        label: 'Siemens Energy AG',
        sublabel: 'Tier-1 | $840K Exposure | SLA 3d',
        entity_id: 'ORD-900124',
      },
    },
    {
      id: 'cust-tesla',
      type: 'customerNode',
      position: { x: 1410, y: 290 },
      data: {
        label: 'Tesla Gigafactory Berlin',
        sublabel: 'Tier-1 | $714K Exposure | SLA 2d',
        entity_id: 'ORD-900125',
      },
    },
  ];

  const initialEdges = [
    { id: 'e1', source: 'sup-042', target: 'mat-1007', animated: true, style: { stroke: '#ef4444', strokeWidth: 2.5 } },
    { id: 'e2', source: 'sup-042', target: 'mat-1012', animated: true, style: { stroke: '#ef4444', strokeWidth: 2.5 } },
    { id: 'e3', source: 'mat-1007', target: 'comp-204', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
    { id: 'e4', source: 'mat-1012', target: 'comp-205', animated: true, style: { stroke: '#f97316', strokeWidth: 2 } },
    { id: 'e5', source: 'comp-204', target: 'prod-5001', style: { stroke: '#64748b', strokeWidth: 1.5 } },
    { id: 'e6', source: 'comp-204', target: 'prod-5004', style: { stroke: '#64748b', strokeWidth: 1.5 } },
    { id: 'e7', source: 'comp-205', target: 'prod-5001', style: { stroke: '#64748b', strokeWidth: 1.5 } },
    { id: 'e8', source: 'comp-205', target: 'prod-5012', style: { stroke: '#64748b', strokeWidth: 1.5 } },
    { id: 'e9', source: 'prod-5001', target: 'plant-03', style: { stroke: '#3b82f6', strokeWidth: 1.5 } },
    { id: 'e10', source: 'prod-5004', target: 'plant-03', style: { stroke: '#3b82f6', strokeWidth: 1.5 } },
    { id: 'e11', source: 'prod-5012', target: 'plant-07', style: { stroke: '#3b82f6', strokeWidth: 1.5 } },
    { id: 'e12', source: 'plant-03', target: 'cust-boeing', animated: true, style: { stroke: '#dc2626', strokeWidth: 2 } },
    { id: 'e13', source: 'plant-03', target: 'cust-siemens', animated: true, style: { stroke: '#dc2626', strokeWidth: 2 } },
    { id: 'e14', source: 'plant-07', target: 'cust-tesla', animated: true, style: { stroke: '#dc2626', strokeWidth: 2 } },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>(initialEdges);

  useEffect(() => {
    fetch('/api/impact/EVT-2026-042')
      .then((res) => res.json())
      .then((data) => {
        setImpactData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load impact data:', err);
        setLoading(false);
      });
  }, [eventId]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Hero Header Breadcrumb & Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              CRITICAL DISRUPTION INVESTIGATION
            </span>
            <span className="text-xs font-mono text-slate-500">Event ID: EVT-2026-042</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            Supplier Delay: SUP-042 Apex Micro-Foundry & Optics
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl">
            14-Day delivery freeze triggered by cleanroom lithography sensor contamination in Hsinchu Fab 3. Cascading multi-echelon impact directly affects 3 plants and 127 customer orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToSimulation}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4" /> Simulate 5 Recovery Strategies <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Dual-Column Canvas + Impact Telemetry */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Left 3 Cols: Interactive React Flow Graph */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[640px] text-left">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Multi-Echelon Dependency Chain & BOM Cascade
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                Interactive Graph (Drag, Zoom, Inspect)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Stockout Path</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Assembly Path</span>
            </div>
          </div>

          <div className="relative flex-1 w-full h-full bg-slate-50">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={1.5}
              defaultEdgeOptions={{ animated: true }}
            >
              <Background color="#cbd5e1" gap={16} size={1} />
              <Controls position="bottom-left" />
              <MiniMap
                nodeColor={(n) => {
                  if (n.type === 'supplierNode') return '#ef4444';
                  if (n.type === 'materialNode') return '#f59e0b';
                  if (n.type === 'customerNode') return '#dc2626';
                  return '#3b82f6';
                }}
                className="!bg-white/80 !border-slate-300"
              />
            </ReactFlow>
          </div>
        </div>

        {/* Right 1 Col: Hero Impact Dashboard */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Cascading Impact Exposure
              </h3>
              <div className="text-2xl font-black text-rose-600">
                ${(impactData?.revenue_at_risk ? impactData.revenue_at_risk / 1000000 : 4.2).toFixed(2)}M
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Total Revenue Exposure Across 127 Orders
              </div>
            </div>

            {/* Inventory Runway Gauge */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Inventory Buffer Runway</span>
                <span className="font-black text-amber-700">5.2 Days</span>
              </div>
              {/* Progress visual */}
              <div className="w-full bg-amber-200/80 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: '37%' }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-amber-800">
                <span>Coverage: 5.2 Days</span>
                <span className="font-bold text-red-600">Day 5.2 Stockout</span>
              </div>
            </div>

            {/* Key Trace Statistics */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Disruption Duration</span>
                <span className="font-bold text-slate-900">14 Calendar Days</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Assembly Plants Affected</span>
                <span className="font-bold text-slate-900">3 (Stuttgart, Detroit, Yokohama)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Finished Products Halted</span>
                <span className="font-bold text-slate-900">3 Models (PROD-5001, 5004, 5012)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Unmitigated Delivery Delay</span>
                <span className="font-bold text-rose-600">+8.8 Days Beyond SLA</span>
              </div>
            </div>

            {/* Primary Affected Materials Breakdown */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Disrupted Raw Materials
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>MAT-1007: Silicon Wafer Substrate</span>
                    <span className="text-amber-600 font-bold">5.2d Runway</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    936 units available / 180 daily consumption
                  </div>
                </div>
                <div className="p-2 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>MAT-1012: GaN Power Die</span>
                    <span className="text-amber-600 font-bold">5.2d Runway</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    494 units available / 95 daily consumption
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={onNavigateToSimulation}
              className="w-full py-2.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
            >
              Simulate 5 Recovery Strategies <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToRecovery}
              className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              Review AI Recovery Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
