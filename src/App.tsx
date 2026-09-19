import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Compass,
  Sliders,
  ShieldCheck,
  Bot,
  FileText,
  Database,
  Radio,
  Building2,
  ChevronDown,
  UserCheck,
  Bell,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ControlTowerView } from './components/ControlTowerView.js';
import { DisruptionsView } from './components/DisruptionsView.js';
import { InvestigationView } from './components/InvestigationView.js';
import { SimulationLabView } from './components/SimulationLabView.js';
import { RecoveryCommandView } from './components/RecoveryCommandView.js';
import { AgentTraceView } from './components/AgentTraceView.js';
import { AuditLogView } from './components/AuditLogView.js';
import { DigitalTwinView } from './components/DigitalTwinView.js';
import { ApprovalModal } from './components/ApprovalModal.js';
import { ScenarioDefinition, RecoveryPlan } from './types/index.js';
import { apiUrl } from './lib/api.js';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('control-tower');
  const [investigatingEventId, setInvestigatingEventId] = useState<string>('EVT-2026-042');
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('SCN-001');
  const [userRole, setUserRole] = useState<string>('SUPPLY_CHAIN_MANAGER');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<RecoveryPlan | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load scenarios & dashboard data
  const refreshDashboard = () => {
    fetch(apiUrl('/api/dashboard'))
      .then((res) => res.json())
      .then((data) => setDashboardData(data))
      .catch((err) => console.error('Dashboard load failed:', err));

    fetch(apiUrl('/api/scenarios'))
      .then((res) => res.json())
      .then((data) => setScenarios(data))
      .catch((err) => console.error('Scenarios load failed:', err));

    fetch(apiUrl('/api/recovery-plans/REC-PLAN-2026-042'))
      .then((res) => res.json())
      .then((data) => setCurrentPlan(data))
      .catch((err) => console.error('Plan load failed:', err));
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleScenarioChange = async (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    try {
      const res = await fetch(apiUrl('/api/scenarios/activate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });
      const data = await res.json();
      showToast(`Activated Scenario: ${data.active_scenario.name}`);
      refreshDashboard();
    } catch (err) {
      console.error('Scenario activation error:', err);
    }
  };

  const handleApprovePlan = async (user: string, role: string) => {
    try {
      const res = await fetch(apiUrl('/api/recovery-plans/REC-PLAN-2026-042/approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, role }),
      });
      const data = await res.json();
      showToast('Plan Approved & Executed! POs Dispatched & Munich Buffer Released.');
      refreshDashboard();
      setActiveTab('control-tower');
    } catch (err) {
      console.error('Plan approval failed:', err);
    }
  };

  const handleRejectPlan = async (user: string) => {
    try {
      await fetch(apiUrl('/api/recovery-plans/REC-PLAN-2026-042/reject'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      });
      showToast('Recovery Plan Rejected by Authorizing Officer.');
      refreshDashboard();
    } catch (err) {
      console.error('Plan rejection failed:', err);
    }
  };

  const isPlanApproved =
    dashboardData?.is_plan_approved ||
    currentPlan?.approval_status === 'APPROVED' ||
    currentPlan?.approval_status === 'EXECUTED';

  const navTabs = [
    { id: 'control-tower', label: 'Control Tower', icon: Compass },
    { id: 'disruptions', label: 'Disruptions', icon: AlertTriangle, count: dashboardData?.active_disruptions_count },
    { id: 'investigation', label: 'Investigation', icon: Layers, highlight: true },
    { id: 'simulation', label: 'Simulation Lab', icon: Sliders },
    { id: 'recovery', label: 'Recovery Command', icon: ShieldCheck, badge: isPlanApproved ? 'Active' : 'Approval Req' },
    { id: 'agent-trace', label: 'Agent Trace', icon: Bot },
    { id: 'audit-log', label: 'Audit Log', icon: FileText },
    { id: 'digital-twin', label: 'Digital Twin', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Enterprise Application Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-y-2 min-h-16 py-2 gap-4">
            {/* Logo & Tagline */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight">SUPPLYCHAIN NEXUS</h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                    NEXORA MFG
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  See the disruption. Simulate the future. Orchestrate the response.
                </p>
              </div>
            </div>

            {/* Scenario Selector & Role Selector Controls */}
            <div className="flex items-center gap-3">
              {/* Scenario Selector */}
              <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Scenario:</span>
                <select
                  value={activeScenarioId}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
                >
                  {scenarios.map((sc) => (
                    <option key={sc.scenario_id} value={sc.scenario_id} className="bg-slate-900 text-white">
                      {sc.scenario_id}: {sc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selector */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="SUPPLY_CHAIN_MANAGER" className="bg-slate-900 text-white">
                    Supply Chain Manager
                  </option>
                  <option value="EXECUTIVE_VP_OPERATIONS" className="bg-slate-900 text-white">
                    Executive VP Operations
                  </option>
                  <option value="MRP_PLANNER" className="bg-slate-900 text-white">
                    MRP Production Planner
                  </option>
                  <option value="PROCUREMENT_LEAD" className="bg-slate-900 text-white">
                    Procurement Lead
                  </option>
                </select>
              </div>

              {/* Live Status Pill */}
              <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="hidden sm:inline">LIVE TELEMETRY</span>
                <span className="sm:hidden">LIVE</span>
              </div>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav className="relative border-t border-slate-800/60">
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        isPlanApproved ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
              })}
            </div>
            {/* Edge fades hint that the tab bar scrolls horizontally on narrow viewports */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-900 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-900 to-transparent" />
          </nav>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'control-tower' && (
          <ControlTowerView
            dashboardData={dashboardData}
            onNavigateToInvestigation={(id) => {
              setInvestigatingEventId(id);
              setActiveTab('investigation');
            }}
            onNavigateToSimulation={() => setActiveTab('simulation')}
            onNavigateToDisruptions={() => setActiveTab('disruptions')}
          />
        )}

        {activeTab === 'disruptions' && (
          <DisruptionsView
            onInvestigate={(id) => {
              setInvestigatingEventId(id);
              setActiveTab('investigation');
            }}
            onSimulate={() => setActiveTab('simulation')}
          />
        )}

        {activeTab === 'investigation' && (
          <InvestigationView
            eventId={investigatingEventId}
            onNavigateToSimulation={() => setActiveTab('simulation')}
            onNavigateToRecovery={() => setActiveTab('recovery')}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationLabView
            onNavigateToRecovery={() => setActiveTab('recovery')}
          />
        )}

        {activeTab === 'recovery' && (
          <RecoveryCommandView
            onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
            isPlanApproved={isPlanApproved}
          />
        )}

        {activeTab === 'agent-trace' && <AgentTraceView />}

        {activeTab === 'audit-log' && <AuditLogView />}

        {activeTab === 'digital-twin' && <DigitalTwinView />}
      </main>

      {/* Human-in-the-loop Approval Modal */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        plan={currentPlan}
        onApprove={handleApprovePlan}
        onReject={handleRejectPlan}
        currentUserRole={userRole}
      />
    </div>
  );
}

export default App;
