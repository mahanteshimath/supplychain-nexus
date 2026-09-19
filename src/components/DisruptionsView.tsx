import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Radio,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Clock,
  DollarSign,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { SupplyChainEvent, SeverityLevel } from '../types/index.js';
import { apiUrl } from '../lib/api.js';

interface DisruptionsViewProps {
  onInvestigate: (eventId: string) => void;
  onSimulate: () => void;
}

export const DisruptionsView: React.FC<DisruptionsViewProps> = ({
  onInvestigate,
  onSimulate,
}) => {
  const [events, setEvents] = useState<SupplyChainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const fetchDisruptions = () => {
    setLoading(true);
    fetch(apiUrl('/api/disruptions'))
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load disruptions:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDisruptions();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || e.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              DISRUPTION REGISTRY & TELEMETRY
            </span>
            <span className="text-xs font-mono text-slate-500">Live Active Alerts</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Active Supply Chain Disruptions & Incident Log
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Real-time multi-source disruption registry monitoring tier-1 suppliers, transshipment ports, factory lines, and transport corridors.
          </p>
        </div>

        <button
          onClick={fetchDisruptions}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Registry
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by entity, ID, supplier name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterSeverity === sev
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Disruptions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Event / Type</th>
                <th className="px-4 py-3">Impacted Entity</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Estimated Impact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEvents.map((evt) => (
                <tr key={evt.event_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{evt.event_type.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{evt.event_id}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-800">{evt.entity_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{evt.entity_id} ({evt.entity_type})</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(evt.severity)}`}>
                      {evt.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {evt.duration_days} Days
                  </td>
                  <td className="px-4 py-3.5 font-bold text-rose-600">
                    ${(evt.estimated_revenue_impact / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {evt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onInvestigate(evt.event_id)}
                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        Investigate <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
