import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Bot,
  Layers,
  Terminal,
  Cpu,
  ShieldAlert,
  ArrowDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AgentTraceRecord } from '../types/index.js';
import { apiUrl } from '../lib/api.js';

export const AgentTraceView: React.FC = () => {
  const [traces, setTraces] = useState<AgentTraceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    'TRACE-001': false,
    'TRACE-002': true,
    'TRACE-004': true,
    'TRACE-005': true,
  });

  const fetchTraces = () => {
    setLoading(true);
    fetch(apiUrl('/api/agents/runs'))
      .then((res) => res.json())
      .then((data) => {
        setTraces(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load agent traces:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTraces();
  }, []);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const getAgentColor = (name: string) => {
    switch (name) {
      case 'Orchestrator':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Impact Agent':
      case 'Impact Analyst':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Simulation Agent':
      case 'Simulation Strategist':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Recovery Agent':
      case 'Recovery Planner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Action Agent':
      case 'Compliance Officer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              AGENTIC WORKFLOW TRACE
            </span>
            <span className="text-xs font-mono text-slate-500">Telemetry Stream: ACTIVE</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Explainable Multi-Agent Execution & Tool Log
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Live execution graph tracing Orchestrator, Impact Agent, Simulation Agent, Recovery Agent, and Action Agent with typed tool inputs, outputs, and reasoning notes.
          </p>
        </div>

        <button
          onClick={fetchTraces}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Traces
        </button>
      </div>

      {/* Visual Multi-Agent Architecture Topology */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Autonomous Multi-Agent Hierarchy & Control Flow
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-purple-500/40">
            <div className="text-[10px] font-bold text-purple-400 uppercase">Coordinator</div>
            <div className="text-xs font-bold text-white mt-1">Orchestrator</div>
            <div className="text-[10px] text-slate-400 mt-1">Directs sub-agents & human gate</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-rose-500/40">
            <div className="text-[10px] font-bold text-rose-400 uppercase">Analyzer</div>
            <div className="text-xs font-bold text-white mt-1">Impact Agent</div>
            <div className="text-[10px] text-slate-400 mt-1">BOM graph & inventory runway</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-blue-500/40">
            <div className="text-[10px] font-bold text-blue-400 uppercase">Calculator</div>
            <div className="text-xs font-bold text-white mt-1">Simulation Agent</div>
            <div className="text-[10px] text-slate-400 mt-1">5 deterministic Python strategies</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-emerald-500/40">
            <div className="text-[10px] font-bold text-emerald-400 uppercase">Synthesizer</div>
            <div className="text-xs font-bold text-white mt-1">Recovery Agent</div>
            <div className="text-[10px] text-slate-400 mt-1">Policy & contract trade-offs</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-amber-500/40">
            <div className="text-[10px] font-bold text-amber-400 uppercase">Executor</div>
            <div className="text-xs font-bold text-white mt-1">Action Agent</div>
            <div className="text-[10px] text-slate-400 mt-1">Dispatches POs post-approval</div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Interactive Timeline */}
      <div className="space-y-4">
        {traces.map((trace, index) => {
          const isExpanded = !!expandedSteps[trace.step_id];

          return (
            <div
              key={trace.step_id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Step Summary Bar */}
              <div
                onClick={() => toggleStep(trace.step_id)}
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getAgentColor(trace.agent_name)}`}>
                        {trace.agent_name}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-blue-600" />
                        {trace.tool_name}()
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {trace.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 font-medium">
                      {trace.reasoning_note}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div className="text-right text-slate-400 text-[11px] font-mono">
                    <div>{trace.duration_ms} ms</div>
                    <div>{new Date(trace.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable JSON Payloads Inspector */}
              {isExpanded && (
                <div className="p-4 bg-slate-950 border-t border-slate-800 text-white text-xs font-mono space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Tool Input Payload */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-blue-400" /> Tool Invocation Input Parameters
                      </div>
                      <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[11px] text-sky-300 leading-relaxed max-h-56">
                        {JSON.stringify(trace.input_payload, null, 2)}
                      </pre>
                    </div>

                    {/* Tool Output Payload */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" /> Tool Structured Output Payload
                      </div>
                      <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[11px] text-emerald-300 leading-relaxed max-h-56">
                        {JSON.stringify(trace.output_payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
