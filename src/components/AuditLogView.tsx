import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { AuditLogEntry } from '../types/index.js';
import { apiUrl } from '../lib/api.js';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAuditLogs = () => {
    setLoading(true);
    fetch(apiUrl('/api/audit'))
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load audit logs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.document_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.requested_by_agent || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.approved_by_user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
              ENTERPRISE GOVERNANCE LEDGER
            </span>
            <span className="text-xs font-mono text-slate-500">Immutable Audit Trail</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            System Compliance & Operational Audit Trail
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Cryptographically sealed and role-validated transaction logs recording autonomous agent actions, human approvals, and ERP integration references.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Log
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, document ref, agent, approver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing {filteredLogs.length} audit events
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp / Log ID</th>
                <th className="px-4 py-3">Action Title</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Authorizing Officer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Execution Result</th>
                <th className="px-4 py-3">Document Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{log.log_id}</div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {log.action_title}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {log.requested_by_agent}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-900">{log.approved_by_user}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{log.user_role}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.approval_status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {log.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {log.result_summary}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-blue-600 font-semibold">
                    {log.document_reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredLogs.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              {logs.length === 0 ? (
                <>No audit events yet. Approve or reject a recovery plan to generate the first entry.</>
              ) : (
                <>No audit events match "{searchTerm}".</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
