import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Factory,
  Package,
  Cpu,
  Boxes,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const SupplierNode = memo(({ data }: any) => {
  return (
    <div className="bg-white border-2 border-red-500 rounded-xl shadow-lg p-3 min-w-[220px] text-left transition-all hover:shadow-xl">
      <Handle type="source" position={Position.Right} className="!bg-red-500" />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded bg-red-50 text-red-600">
            <Factory className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-red-600">Supplier (Disrupted)</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
          Risk: {data.risk_score}
        </span>
      </div>
      <div className="text-xs font-bold text-slate-900 leading-tight">{data.label}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{data.sublabel}</div>
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <span className="text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3 text-red-500" /> {data.lead_time}
        </span>
        <span className="font-semibold text-red-600 bg-red-50 px-1 rounded">14d Delay</span>
      </div>
    </div>
  );
});

export const MaterialNode = memo(({ data }: any) => {
  return (
    <div className="bg-white border-2 border-amber-500 rounded-xl shadow-md p-3 min-w-[210px] text-left transition-all hover:shadow-xl">
      <Handle type="target" position={Position.Left} className="!bg-amber-500" />
      <Handle type="source" position={Position.Right} className="!bg-amber-500" />
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded bg-amber-50 text-amber-600">
            <Package className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600">Raw Material</span>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 animate-pulse">
          {data.stockout}
        </span>
      </div>
      <div className="text-xs font-bold text-slate-900 leading-tight">{data.label}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{data.sublabel}</div>
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <span className="text-amber-700 font-semibold">{data.coverage}</span>
        <span className="text-[9px] text-slate-400 font-mono">{data.entity_id}</span>
      </div>
    </div>
  );
});

export const ComponentNode = memo(({ data }: any) => {
  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-sm p-3 min-w-[200px] text-left transition-all hover:border-blue-400 hover:shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
      <div className="flex items-center gap-1.5 mb-1">
        <span className="p-1 rounded bg-blue-50 text-blue-600">
          <Cpu className="w-3.5 h-3.5" />
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">BOM Component</span>
      </div>
      <div className="text-xs font-bold text-slate-800 leading-tight">{data.label}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{data.sublabel}</div>
      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <span className="text-orange-600 font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Starvation Threat
        </span>
      </div>
    </div>
  );
});

export const ProductNode = memo(({ data }: any) => {
  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-sm p-3 min-w-[210px] text-left transition-all hover:border-indigo-400 hover:shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-indigo-500" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
      <div className="flex items-center gap-1.5 mb-1">
        <span className="p-1 rounded bg-indigo-50 text-indigo-600">
          <Boxes className="w-3.5 h-3.5" />
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600">Finished Product</span>
      </div>
      <div className="text-xs font-bold text-slate-900 leading-tight">{data.label}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{data.sublabel}</div>
      <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-indigo-700 font-medium">
        Active Assembly Schedule
      </div>
    </div>
  );
});

export const PlantNode = memo(({ data }: any) => {
  return (
    <div className="bg-white border-2 border-slate-400 rounded-xl shadow-md p-3 min-w-[200px] text-left transition-all hover:shadow-lg">
      <Handle type="target" position={Position.Left} className="!bg-slate-600" />
      <Handle type="source" position={Position.Right} className="!bg-slate-600" />
      <div className="flex items-center gap-1.5 mb-1">
        <span className="p-1 rounded bg-slate-100 text-slate-700">
          <Building2 className="w-3.5 h-3.5" />
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-700">Assembly Plant</span>
      </div>
      <div className="text-xs font-bold text-slate-900 leading-tight">{data.label}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{data.sublabel}</div>
      <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-rose-600 font-semibold">
        Line Stoppage Expected Day 6
      </div>
    </div>
  );
});

export const CustomerNode = memo(({ data }: any) => {
  return (
    <div className="bg-white border-2 border-red-400 rounded-xl shadow-md p-3 min-w-[220px] text-left transition-all hover:shadow-xl">
      <Handle type="target" position={Position.Left} className="!bg-red-500" />
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded bg-red-50 text-red-600">
            <Users className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-red-600">Customer (Tier-1)</span>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
          SLA At Risk
        </span>
      </div>
      <div className="text-xs font-bold text-slate-900 leading-tight">{data.label}</div>
      <div className="text-[11px] text-slate-600 font-medium mt-0.5">{data.sublabel}</div>
      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <span className="text-slate-500 font-mono">{data.entity_id}</span>
        <span className="text-red-600 font-bold">Penalty Exposure</span>
      </div>
    </div>
  );
});

export const nodeTypes = {
  supplierNode: SupplierNode,
  materialNode: MaterialNode,
  componentNode: ComponentNode,
  productNode: ProductNode,
  plantNode: PlantNode,
  customerNode: CustomerNode,
};
