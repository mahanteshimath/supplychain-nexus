import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Lock,
  DollarSign,
  PackageCheck,
  Building,
  Truck,
  Layers,
} from 'lucide-react';
import { RecoveryPlan } from '../types/index.js';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RecoveryPlan | null;
  onApprove: (user: string, role: string) => Promise<void>;
  onReject: (user: string) => Promise<void>;
  currentUserRole: string;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  plan,
  onApprove,
  onReject,
  currentUserRole,
}) => {
  const [approverName, setApproverName] = useState('Helena Vance');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);

  if (!isOpen || !plan) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(approverName, currentUserRole);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(approverName);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Human-in-the-Loop Recovery Plan Approval</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CRITICAL GATE
                </span>
              </div>
              <p className="text-xs text-slate-300">Authorization Required: Operational Expenditure & Sourcing Override</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unmitigated Exposure</div>
              <div className="text-lg font-black text-rose-600 mt-0.5">
                ${(plan.total_revenue_exposure / 1000000).toFixed(2)}M
              </div>
              <div className="text-[10px] text-slate-500">127 Customer Orders</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Protected by Plan</div>
              <div className="text-lg font-black text-emerald-600 mt-0.5">
                ${(plan.total_revenue_protected / 1000000).toFixed(2)}M
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold">98.1% Protected</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Authorizing Cost</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                ${(plan.total_additional_cost / 1000).toFixed(0)}K
              </div>
              <div className="text-[10px] text-slate-500">Net Value +$3.93M</div>
            </div>
          </div>

          {/* Action Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" /> Authorized Action Manifest ({plan.actions.length} Directives)
            </h4>
            <div className="space-y-2">
              {plan.actions.map((act, idx) => (
                <div
                  key={act.action_id}
                  className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors flex items-start justify-between gap-3 text-left"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        ACT-0{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{act.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{act.description}</p>
                    <div className="text-[10px] text-slate-400 font-mono">Target: {act.target_entity}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-800">
                      {act.estimated_cost > 0 ? `$${(act.estimated_cost / 1000).toFixed(0)}K` : 'NO COST'}
                    </div>
                    <div className="text-[10px] font-mono text-blue-600 font-medium">{act.document_ref}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Governance & Policy Validation */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Corporate Procurement Policy Compliance Verified
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Automated legal agent verified Contract CTR-SUP118 Clause 8.2 (Pre-authorized dual sourcing for disruptions &gt; 10 days). Inter-facility transit protocol aligns with ISO-22301 business continuity standards.
            </p>
          </div>

          {/* User Sign-off Inputs */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Sign-off Identity & Delegation of Authority
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Authorizing Officer</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Active Enterprise Role</label>
                <div className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono font-semibold">
                  {currentUserRole}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Execution triggers instant ERP Purchase Order dispatch
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
            >
              Reject Plan
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Executing Directives...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Approve & Execute Recovery Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
