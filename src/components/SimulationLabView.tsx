import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Sliders,
  DollarSign,
  ShieldCheck,
  Clock,
  PackageCheck,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { SimulationStrategyResult } from '../types/index.js';
import { apiUrl } from '../lib/api.js';

interface SimulationLabViewProps {
  onNavigateToRecovery: () => void;
}

// The backend only returns strategy_name + reasons; this is the minimal fixed
// lookup needed to render a title/description/actions for each known strategy.
const STRATEGY_META: Record<string, { title: string; description: string; actions: string[] }> = {
  DO_NOTHING: {
    title: 'Do Nothing',
    description: 'No intervention while waiting for the supplier to recover on its own.',
    actions: ['Monitor supplier recovery status daily.', 'Notify affected customers of potential delay.'],
  },
  EXPEDITE: {
    title: 'Expedite Primary Supplier',
    description: "Pay a premium to accelerate the primary supplier's recovery timeline.",
    actions: ['Issue expedite request to the primary supplier.', 'Approve premium freight for the first shipment.'],
  },
  REALLOCATE_INVENTORY: {
    title: 'Reallocate Inventory',
    description: 'Transfer available buffer stock from unaffected plants to constrained assembly lines.',
    actions: ['Authorize inter-plant inventory transfer.', 'Reprioritize transport lanes for buffer stock.'],
  },
  ALTERNATE_SUPPLIER: {
    title: 'Use Alternate Supplier',
    description: 'Activate qualified alternate supplier capacity to cover the shortfall.',
    actions: ['Issue purchase order to the alternate supplier.', 'Confirm no quality requalification is required.'],
  },
  RESCHEDULE_PRODUCTION: {
    title: 'Reschedule Production',
    description: 'Resequence production so Tier-1 customer orders receive available capacity first.',
    actions: ['Reprioritize the MRP schedule for Tier-1 orders.', 'Notify lower-priority customers of revised dates.'],
  },
};

const LIVE_REFRESH_INTERVAL_MS = 10_000;

export const SimulationLabView: React.FC<SimulationLabViewProps> = ({
  onNavigateToRecovery,
}) => {
  const [durationDays, setDurationDays] = useState(14);
  const [strategies, setStrategies] = useState<SimulationStrategyResult[]>([]);
  const [recommendedId, setRecommendedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const runSimulation = (days: number) => {
    setLoading(true);
    fetch(apiUrl('/api/simulations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier_id: 'SUP-042', disruption_days: days }),
    })
      .then((res) => res.json())
      .then((data) => {
        const nextStrategies: SimulationStrategyResult[] = data.strategies || [];
        setStrategies(nextStrategies);
        setRecommendedId(data.recommended_strategy?.strategy_id || '');
        setSelectedStrategy((current) =>
          nextStrategies.some((s) => s.strategy_id === current)
            ? current
            : data.recommended_strategy?.strategy_id || nextStrategies[0]?.strategy_id || ''
        );
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to run simulation:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    runSimulation(durationDays);
    const interval = setInterval(() => runSimulation(durationDays), LIVE_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [durationDays]);

  // Chart dataset
  const chartData = strategies.map((s) => ({
    name: s.strategy_name.replace(/_/g, ' '),
    revenueProtected: s.revenue_protected / 1000,
    cost: s.additional_cost / 1000,
    netBenefit: s.net_benefit / 1000,
    delay: s.delay_days,
    ordersSaved: s.orders_saved,
    slaRiskPct: Math.round(s.customer_sla_risk * 100),
  }));

  const activeStrategy = strategies.find((s) => s.strategy_id === selectedStrategy);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Simulation Lab Header & Scenario Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                DETERMINISTIC SIMULATION ENGINE
              </span>
              <span className="text-xs font-mono text-slate-500">Target: SUP-042</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              What happens if SUP-042 is unavailable for {durationDays} days?
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Evaluate 5 deterministic operational recovery strategies against manufacturing constraints, contract terms, and customer SLAs.
            </p>
          </div>

          {/* Interactive Parameters Slider */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-left">
              <div className="text-[11px] font-bold text-slate-700">Disruption Duration</div>
              <div className="text-xs font-mono font-bold text-blue-600">{durationDays} Calendar Days</div>
            </div>
            <input
              type="range"
              min="7"
              max="28"
              step="1"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-36 accent-blue-600 cursor-pointer"
            />
            <button
              onClick={() => runSimulation(durationDays)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
            >
              Re-Simulate
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
          {loading
            ? 'Refreshing live simulation…'
            : `Live data · last updated ${lastUpdated ? lastUpdated.toLocaleTimeString() : '—'} · auto-refreshes every ${LIVE_REFRESH_INTERVAL_MS / 1000}s`}
        </div>
      </div>

      {/* Comparison Strategy Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 text-left">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            Evaluated Recovery Strategies ({strategies.length})
          </h3>
          <span className="text-xs text-slate-500">Click any strategy card to inspect details below</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && strategies.length === 0 &&
            [0, 1, 2].map((i) => (
              <div key={`skeleton-${i}`} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse space-y-3">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-2.5 w-full bg-slate-100 rounded" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-2.5 w-24 bg-slate-100 rounded" />
              </div>
            ))}
          {!loading && strategies.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 py-12 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl">
              No simulation results yet. Adjust the disruption duration and re-simulate.
            </div>
          )}
          {strategies.map((strat) => {
            const isSelected = strat.strategy_id === selectedStrategy;
            const isRecommended = strat.strategy_id === recommendedId;
            const meta = STRATEGY_META[strat.strategy_name];

            return (
              <div
                key={strat.strategy_id}
                onClick={() => setSelectedStrategy(strat.strategy_id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                  isRecommended
                    ? isSelected
                      ? 'bg-blue-50/90 border-2 border-blue-600 shadow-md ring-2 ring-blue-600/20'
                      : 'bg-blue-50/40 border border-blue-300 hover:border-blue-400'
                    : isSelected
                    ? 'bg-white border-2 border-slate-900 shadow-md'
                    : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI RECOMMENDED
                  </div>
                )}

                <div className="text-xs font-bold text-slate-900 mb-1">{meta?.title ?? strat.strategy_name.replace(/_/g, ' ')}</div>
                <p className="text-[11px] text-slate-600 line-clamp-2 mb-3 min-h-[32px]">
                  {meta?.description ?? strat.reasons.join(' ')}
                </p>

                {/* Strategy Key Metric Tiles */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 mb-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Revenue Protected</span>
                    <div className="font-bold text-emerald-600">
                      ${(strat.revenue_protected / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Execution Cost</span>
                    <div className="font-bold text-slate-800">
                      {strat.additional_cost > 0 ? `$${(strat.additional_cost / 1000).toFixed(0)}K` : '$0'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Orders Saved</span>
                    <div className="font-bold text-slate-800">{strat.orders_saved} of 127</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Delivery Delay</span>
                    <div className="font-bold text-slate-800">{strat.delay_days} Days</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Customer SLA Risk</span>
                  <span className={`font-bold ${strat.customer_sla_risk > 0.5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {(strat.customer_sla_risk * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recharts Comparative Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Chart 1: Revenue Protected vs. Operational Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Financial Payoff Comparison ($ in Thousands)
            </h4>
            <p className="text-[11px] text-slate-500">Revenue Protected vs. Additional Operational Cost</p>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [`$${value}K`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="revenueProtected" name="Revenue Protected ($K)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Additional Cost ($K)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Delay Reduction vs SLA Risk */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Operational Delay & SLA Risk Trade-off
            </h4>
            <p className="text-[11px] text-slate-500">Delivery Delay Days vs. Customer Breach Probability (%)</p>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="delay" name="Delay Days" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="slaRiskPct" name="SLA Risk (%)" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Selected Strategy Deep Dive & Section 31 Comparison Matrix */}
      {activeStrategy && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                SELECTED STRATEGY DOSSIER
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {STRATEGY_META[activeStrategy.strategy_name]?.title ?? activeStrategy.strategy_name.replace(/_/g, ' ')}
              </h3>
            </div>
            <button
              onClick={onNavigateToRecovery}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow flex items-center gap-1.5"
            >
              Configure Action Plan in Recovery Command <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Key Trade-offs & Rationales</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {activeStrategy.reasons.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Required Operational Directives</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(STRATEGY_META[activeStrategy.strategy_name]?.actions ?? []).map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
