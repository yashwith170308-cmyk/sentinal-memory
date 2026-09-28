import React, { useState, useEffect } from 'react';
import {
  Brain, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck,
  ShieldAlert, RefreshCw, Sparkles, ArrowDown, ChevronRight, Play
} from 'lucide-react';
import { ComparisonScenario } from '../types';
import { api } from '../services/api';

export const LearningPage: React.FC<{ onNavigateToInvestigation: () => void }> = ({ onNavigateToInvestigation }) => {
  const [comparison, setComparison] = useState<ComparisonScenario | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);

  useEffect(() => {
    api.getComparison().then(setComparison).catch(console.error);
  }, []);

  const steps = [
    {
      step: 1,
      title: "INITIAL STATE",
      subtitle: "Uncontextualized Agent",
      desc: "Sentinel has zero organizational memory regarding enterprise backup tools or specific approved scripts.",
      badge: "NO MEMORY"
    },
    {
      step: 2,
      title: "ALERT INVESTIGATION #1",
      subtitle: "Generic Alarm Triggered",
      desc: "winword.exe spawning PowerShell on BACKUP-SRV-01 triggers high-risk quarantine recommendation.",
      badge: "GENERIC HIGH RISK"
    },
    {
      step: 3,
      title: "ANALYST FEEDBACK COMMITTED",
      subtitle: "Hindsight Retention Loop",
      desc: "Analyst confirms: 'This was an authorized backup archiver routine doc_archiver.ps1.' Feedback retained in Hindsight.",
      badge: "HINDSIGHT RETAIN"
    },
    {
      step: 4,
      title: "ALERT INVESTIGATION #2",
      subtitle: "Context-Aware Precedent Recall",
      desc: "Similar alert on FINANCE-PC-18 appears. Sentinel recalls the retained backup exception and prevents false isolation.",
      badge: "SMART RESOLUTION"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 mb-1">
          <Brain className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-bold text-white font-mono">
            ORGANIZATIONAL LEARNING & MEMORY EVOLUTION
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Visual demonstration of how Sentinel learns from SOC analyst feedback via Vectorize Hindsight and avoids repeating identical investigative errors.
        </p>
      </div>

      {/* 4-Step Learning Progression Flowchart */}
      <div className="glass-panel p-6 rounded-2xl border border-sky-500/25 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            The Sentinel Learning Loop (Alert → Memory → Feedback → Evolution)
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            CONTINUOUS INSTITUTIONAL INTELLIGENCE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                activeStep === s.step
                  ? 'bg-sky-950/50 border-sky-500 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 font-mono text-xs font-bold flex items-center justify-center border border-sky-500/30">
                  {s.step}
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {s.badge}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white font-mono mb-0.5">{s.title}</h4>
              <span className="text-[11px] text-sky-400 font-medium block mb-2">{s.subtitle}</span>
              <p className="text-[11px] text-slate-300 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Before & After Memory Comparison (Section 13 requirement) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Comparative Investigation Matrix (Same Alert Telemetry)
          </span>
          <span className="text-xs font-mono text-slate-500">
            Target Alert: {comparison?.alert.title || 'Scheduled Document Archiver'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: WITHOUT MEMORY */}
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 via-[#0d131f] to-[#090e18] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span className="font-mono font-bold text-sm text-rose-300">WITHOUT HINDSIGHT MEMORY</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 border border-rose-500/40 text-rose-300 font-bold">
                RISK: HIGH (65%)
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                Generic Assessment:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {comparison?.without_memory.summary || "Suspicious PowerShell spawned by Microsoft Word. Flagged as malicious macro compromise."}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Heuristic Reasoning (Rule-Based):
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                {(comparison?.without_memory.reasoning || [
                  "Process hierarchy matches classic MITRE ATT&CK T1204 / T1059.",
                  "Zero organizational context regarding internal automation scripts.",
                  "Automated playbook flags all Word spawns as active intrusion."
                ]).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold text-rose-400 uppercase tracking-wider block mb-1.5">
                Generic Recommendations:
              </span>
              <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                {(comparison?.without_memory.recommended_actions || [
                  "Immediately quarantine host BACKUP-SRV-01.",
                  "Revoke domain user credentials.",
                  "Initiate urgent forensic image capture."
                ]).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
              <strong className="text-rose-300 block mb-0.5">Negative Operational Consequence:</strong>
              {comparison?.without_memory.consequences || "Severe false positive impact: Mission-critical enterprise backup server quarantined unnecessarily. Business disruption."}
            </div>
          </div>

          {/* Card 2: WITH HINDSIGHT MEMORY */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-[#0d1a24] to-[#090e18] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-mono font-bold text-sm text-emerald-300">WITH HINDSIGHT MEMORY</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                RISK: LOW (94%)
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Context-Aware Assessment:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {comparison?.with_hindsight_memory.summary || "Alert matches known approved enterprise backup routine doc_archiver.ps1 on BACKUP-SRV-01. Hindsight recalled prior analyst determination."}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider block mb-1.5">
                Memory Precedent Context:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                {(comparison?.with_hindsight_memory.reasoning || [
                  "Hindsight recalled INC-0052: identical execution pattern was verified by Lead Analyst as legitimate IT archiving routine.",
                  "Service account CORP_SVC_BACKUP matches previously approved enterprise automation identity.",
                  "Risk safely downgraded from HIGH to LOW with 94% confidence, eliminating alert fatigue."
                ]).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider block mb-1.5">
                Contextual Recommendations:
              </span>
              <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                {(comparison?.with_hindsight_memory.recommended_actions || [
                  "Verify script execution against the scheduled change-window management database.",
                  "Check user context against IT Systems Engineering roster.",
                  "Mark alert as confirmed false positive without quarantining the server."
                ]).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
              <strong className="text-emerald-300 block mb-0.5">Defensive Operational Advantage:</strong>
              {comparison?.with_hindsight_memory.consequences || "Zero downtime: Prevents false quarantine, saves analyst hours, continuously reinforces organizational memory."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
