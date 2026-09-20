import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  PackageCheck,
  Building2,
  Clock,
  Sparkles,
  Bot,
  FileText,
  Lock,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { RecoveryPlan } from '../types/index.js';
import { apiUrl } from '../lib/api.js';

interface RecoveryCommandViewProps {
  onOpenApprovalModal: () => void;
  isPlanApproved: boolean;
}

export const RecoveryCommandView: React.FC<RecoveryCommandViewProps> = ({
  onOpenApprovalModal,
  isPlanApproved,
}) => {
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/recovery-plans/REC-PLAN-2026-042'))
      .then((res) => res.json())
      .then((data) => {
        setPlan(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch plan:', err);
        setLoading(false);
      });
  }, [isPlanApproved]);

  const fetchAiExecutiveBrief = async () => {
    setGeneratingAi(true);
    try {
      const res = await fetch(apiUrl('/api/executive-brief'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disruption_title: 'Apex Micro-Foundry (SUP-042) 14-Day Disruption',
          revenue_exposure: 4200000,
        }),
      });
      const data = await res.json();
      setAiBrief(data.text);
    } catch (err) {
      console.error('AI brief error:', err);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Recovery Command Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              RECOVERY ORCHESTRATION ENGINE
            </span>
            <span className="text-xs font-mono text-slate-500">Plan Ref: REC-PLAN-2026-042</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Recovery Command Center: SUP-042 Disruption
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Autonomous multi-agent formulated plan blending dual-sourcing, inter-plant inventory transfers, and MRP Tier-1 prioritization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPlanApproved ? (
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              PLAN APPROVED & EXECUTED
            </div>
          ) : (
            <button
              onClick={onOpenApprovalModal}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" /> REQUEST APPROVAL <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Exposure vs Protection Hero Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Exposure</div>
          <div className="text-xl font-black text-rose-600 mt-1">$4.20M</div>
          <div className="text-[10px] text-slate-500 mt-0.5">127 Customer Orders</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Revenue Protected</div>
          <div className="text-xl font-black text-emerald-600 mt-1">$4.12M</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">98.1% of Total Risk</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Additional Cost</div>
          <div className="text-xl font-black text-slate-900 mt-1">$192K</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Net Payoff: +$3.93M</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Orders Protected</div>
          <div className="text-xl font-black text-slate-900 mt-1">122 <span className="text-xs text-slate-500 font-normal">/ 127</span></div>
          <div className="text-[10px] text-slate-500 mt-0.5">100% Tier-1 SLAs Saved</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Residual SLA Risk</div>
          <div className="text-xl font-black text-emerald-600 mt-1">4.2%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Down from 89% Baseline</div>
        </div>
      </div>

      {/* Main 2-Column: Proposed Directives + Gemini Strategic Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Proposed Action Manifest */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Proposed 4-Part Corrective Recovery Directives
              </h3>
              <p className="text-xs text-slate-500">Requires verified human approval before dispatch to ERP and transport systems</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
              4 Executable Actions
            </span>
          </div>

          <div className="space-y-3">
            {plan?.actions.map((action, idx) => (
              <div
                key={action.action_id}
                className={`p-4 rounded-xl border transition-all ${
                  isPlanApproved
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                        Step 0{idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{action.title}</h4>
                      {isPlanApproved && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> EXECUTED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3 pt-1">
                      <span>Target: {action.target_entity}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-semibold">{action.document_ref}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900">
                      {action.estimated_cost > 0 ? `$${(action.estimated_cost / 1000).toFixed(0)}K` : 'NO COST'}
                    </div>
                    <div className="text-[10px] text-slate-500">Budget Code</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Trigger Button Bottom */}
          {!isPlanApproved && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total Operational Authorization: <strong className="text-slate-800">$192,000</strong>
              </span>
              <button
                onClick={onOpenApprovalModal}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-all flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" /> Open Authorization Modal & Approve
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: AI Agent Synthesis & Policy Grounding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-blue-600" />
                Explainable Agent Synthesis
              </h3>
              <button
                onClick={fetchAiExecutiveBrief}
                disabled={generatingAi}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                {generatingAi ? 'Analyzing...' : 'Refresh AI Brief'}
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans space-y-2.5 max-h-[380px] overflow-y-auto">
              {aiBrief ? (
                <div className="space-y-2 whitespace-pre-line text-[11px] leading-relaxed">
                  {aiBrief}
                </div>
              ) : (
                <div className="space-y-2 text-[11px] leading-relaxed text-slate-600">
                  <div className="font-bold text-slate-900">Recovery Agent Evaluation Rationale:</div>
                  <p>
                    1. <strong>Dual-Sourcing Sizing</strong>: Procuring 4,000 units from Kyoto Precision (SUP-118) immediately bridges 65% of the cleanroom deficit with zero tool re-qualification time.
                  </p>
                  <p>
                    2. <strong>Buffer Hub Siphon</strong>: Transferring 3,500 units from Munich (PLANT-05) via dedicated ground haulage protects assembly continuity on Day 6 before parts arrive from Japan.
                  </p>
                  <p>
                    3. <strong>SLA Defense</strong>: Resequencing line schedules ensures Boeing, Siemens, and Tesla shipments depart with zero penalty infractions.
                  </p>
                </div>
              )}
            </div>

            {/* Policy & Contract Rules */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px]">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                Contract CTR-SUP118 Clause 8.2 Grounding
              </div>
              <p className="text-[10px] text-emerald-800 leading-normal">
                Dual-sourcing authorized under emergency protocol. Pricing fixed at $455/unit with 3-day SLA guarantee.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={onOpenApprovalModal}
              disabled={isPlanApproved}
              className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5 ${
                isPlanApproved
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isPlanApproved ? 'Directives Successfully Dispatched' : 'Submit for Human Approval'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
