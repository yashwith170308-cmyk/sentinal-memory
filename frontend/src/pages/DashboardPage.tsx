import React, { useEffect, useState } from 'react';
import {
  Shield, Brain, Database, AlertTriangle, CheckCircle, Activity,
  ArrowRight, Sparkles, Terminal, FileText, Cpu, RefreshCw
} from 'lucide-react';
import { SeverityBadge } from '../components/SeverityBadge';
import { DemoAlert, MemoryStats, IncidentItem } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  onSelectAlert: (alert: DemoAlert) => void;
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectAlert, onNavigate }) => {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [prebuiltAlerts, setPrebuiltAlerts] = useState<DemoAlert[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<IncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, alertsData, incidentsData] = await Promise.all([
        api.getMemoryStats(),
        api.getPrebuiltAlerts(),
        api.getIncidents()
      ]);
      setStats(statsData);
      setPrebuiltAlerts(alertsData);
      setRecentIncidents(incidentsData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-sky-500/20 bg-gradient-to-r from-[#0c1629]/90 via-[#0a1120]/90 to-[#070b14]/90 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>POWERED BY VECTORIZE HINDSIGHT ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              SOC OPERATIONS WITH LONG-TERM MEMORY
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard AI chatbots investigate alerts in a vacuum. <strong className="text-sky-300">Sentinel Memory</strong> connects every incoming alert to your organization's historical incidents, approved IT exceptions, and previous analyst feedback.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate('demo')}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wider uppercase font-mono shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              <span>RUN 60-SEC JUDGE DEMO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('investigation')}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs tracking-wider uppercase font-mono shadow-lg shadow-sky-950/40 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>INVESTIGATE NEW ALERT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hindsight Status */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">MEMORY STATUS</span>
            <div className={`p-1.5 rounded-lg ${stats?.hindsight_connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-xl font-bold font-mono ${stats?.hindsight_connected ? 'text-emerald-300' : 'text-amber-300'}`}>
              {stats?.hindsight_connected ? 'CONNECTED' : 'STANDBY'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 font-mono truncate">
            Bank: {stats?.bank_id || 'sentinel-memory'}
          </span>
        </div>

        {/* Card 2: Seeded Incidents */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">ORGANIZATIONAL PRECEDENTS</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              {stats?.total_incidents_seeded || 9}
            </span>
            <span className="text-xs text-sky-400">Incidents</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            MITRE ATT&CK mapped experiences
          </span>
        </div>

        {/* Card 3: Analyst Feedbacks */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">ANALYST REINFORCEMENTS</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              {stats?.retained_feedbacks_count || 0}
            </span>
            <span className="text-xs text-indigo-400">Retained</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Continuous organizational learning
          </span>
        </div>

        {/* Card 4: False Positive Mitigation */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">FP EXCLUSIONS LEARNED</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-300">
              {stats?.false_positives_learned || 3}
            </span>
            <span className="text-xs text-emerald-400">Approved Tools</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Eliminates repetitive alert fatigue
          </span>
        </div>
      </div>

      {/* Main Grid: Live Queue & Historical Precedents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ingest & Prebuilt Demo Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Interactive Security Alert Queue
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Click any alert to initiate Hindsight investigation
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {prebuiltAlerts.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectAlert(item)}
                className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer transition-all border border-slate-800 hover:border-sky-500/40"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <SeverityBadge severity={item.alert.severity} size="sm" />
                    <span className="text-xs font-bold text-white font-mono">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-2.5">{item.description}</p>

                {/* Telemetry snippet */}
                <div className="p-2 rounded bg-slate-950/70 border border-slate-900 font-mono text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Host: <strong className="text-slate-200">{item.alert.host}</strong></span>
                  <span>Process: <strong className="text-sky-300">{item.alert.parent_process} → {item.alert.process}</strong></span>
                  {item.alert.destination && (
                    <span>Dest: <strong className="text-orange-300">{item.alert.destination}</strong></span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400/90 font-mono">
                    Expected: {item.expected_behavior}
                  </span>
                  <span className="text-sky-400 flex items-center gap-1 font-semibold">
                    Investigate <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Active Organizational Patterns & Recent Memory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Active Memory Patterns
              </h3>
            </div>
            <button onClick={loadData} className="p-1 hover:text-white text-slate-400 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] text-slate-400 font-mono block">
              RECOGNIZED INSTITUTIONAL PATTERNS IN HINDSIGHT:
            </span>
            <div className="space-y-2">
              {(stats?.active_patterns || [
                "Word -> PowerShell Macro Execution",
                "Encoded PowerShell Base64 Payloads",
                "Enterprise Scheduled Backup Verification",
                "Cobalt Strike Beacon Telemetry",
                "EnterpriseDocGen Finance Add-in Exemption"
              ]).map((pattern, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex items-center space-x-2 text-slate-300"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-mono text-[11px]">{pattern}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Comparison Card */}
          <div
            onClick={() => onNavigate('learning')}
            className="rounded-xl border border-sky-500/30 bg-gradient-to-b from-sky-950/30 to-indigo-950/20 p-4 cursor-pointer hover:border-sky-400/50 transition-all"
          >
            <div className="flex items-center space-x-2 mb-2 text-sky-400 font-mono text-xs font-bold">
              <Brain className="w-4 h-4" />
              <span>BEFORE VS AFTER MEMORY</span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              See the visual comparison of how an investigation changes when Sentinel recalls Hindsight organizational memory.
            </p>
            <span className="text-xs text-sky-400 flex items-center gap-1 font-semibold">
              View Memory Comparison <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
