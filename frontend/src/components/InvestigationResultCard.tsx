import React, { useState } from 'react';
import { Shield, CheckSquare, Square, AlertOctagon, Terminal, FileText, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';
import { InvestigationResult } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface InvestigationResultCardProps {
  result: InvestigationResult;
}

export const InvestigationResultCard: React.FC<InvestigationResultCardProps> = ({ result }) => {
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const toggleAction = (idx: number) => {
    setCompletedActions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Separate evidence bullets into Current Alert vs Historical
  const currentEvidence = result.reasoning.filter(
    r => r.toUpperCase().includes('CURRENT ALERT') || (!r.toUpperCase().includes('HISTORICAL') && !r.toUpperCase().includes('SYNTHESIS'))
  );
  const historicalEvidence = result.reasoning.filter(
    r => r.toUpperCase().includes('HISTORICAL') || r.toUpperCase().includes('MEMORY')
  );
  const synthesisEvidence = result.reasoning.filter(
    r => r.toUpperCase().includes('SYNTHESIS')
  );

  return (
    <div className="rounded-xl border border-sky-500/20 bg-[#0b121e]/90 p-5 shadow-2xl backdrop-blur-md space-y-5">
      {/* Top Banner: Risk Level, Confidence, Execution Time */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <SeverityBadge severity={result.risk_level} size="lg" />
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span>INVESTIGATION REPORT: {result.alert_id}</span>
              {result.investigation_id && (
                <span className="text-[11px] text-slate-500 font-normal">({result.investigation_id})</span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Confidence Score: <strong className="text-sky-300 font-mono">{(result.confidence * 100).toFixed(0)}%</strong>
              {result.execution_time_ms && (
                <span className="ml-3 text-slate-500 font-mono">
                  Latency: {result.execution_time_ms}ms
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Confidence Gauge Bar */}
        <div className="w-48 bg-slate-900 border border-slate-800 rounded-lg p-2">
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>SOC CONFIDENCE</span>
            <span className="text-sky-400 font-bold">{Math.round(result.confidence * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                result.confidence > 0.8
                  ? 'bg-gradient-to-r from-sky-500 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-500 to-sky-400'
              }`}
              style={{ width: `${Math.round(result.confidence * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
        <span className="text-[10px] font-mono font-semibold text-sky-400 uppercase tracking-wider block mb-1">
          Executive SOC Summary
        </span>
        <p className="text-xs text-slate-200 leading-relaxed">{result.summary}</p>
      </div>

      {/* Key Observable Indicators */}
      <div>
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block mb-2">
          Observable Technical Indicators (Current Alert)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {result.key_indicators.map((ind, i) => (
            <div
              key={i}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300"
            >
              <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{ind}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strict Evidence Separation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Current Alert Evidence */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-sky-500/20">
          <div className="flex items-center space-x-2 text-sky-400 font-mono text-xs font-bold mb-2">
            <Cpu className="w-4 h-4" />
            <span>CURRENT ALERT EVIDENCE</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Strictly observable attributes extracted from the incoming telemetry stream:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {currentEvidence.length > 0 ? (
              currentEvidence.map((e, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>{e.replace(/^CURRENT ALERT EVIDENCE:\s*/i, '')}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400">Process and network telemetry extracted.</li>
            )}
          </ul>
        </div>

        {/* Right: Historical Memory Context */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20">
          <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold mb-2">
            <FileText className="w-4 h-4" />
            <span>HISTORICAL MEMORY CONTEXT (HINDSIGHT)</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Precedents recalled from previous organizational investigations:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {historicalEvidence.length > 0 ? (
              historicalEvidence.map((h, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{h.replace(/^HISTORICAL MEMORY CONTEXT:\s*/i, '')}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">No prior organizational memory found for this pattern.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Synthesis Section if present */}
      {synthesisEvidence.length > 0 && (
        <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/20 text-xs text-sky-200">
          <span className="font-mono font-bold text-sky-300 uppercase text-[10px] tracking-wider block mb-1">
            Differential Synthesis & Memory Impact:
          </span>
          <p className="text-slate-300">
            {synthesisEvidence[0].replace(/^SYNTHESIS:\s*/i, '')}
          </p>
        </div>
      )}

      {/* Recommended SOC Actions (Interactive Playbook Checklist) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Recommended Defensive Response Playbook
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {Object.values(completedActions).filter(Boolean).length}/{result.recommended_actions.length} Completed
          </span>
        </div>
        <div className="space-y-2">
          {result.recommended_actions.map((action, idx) => {
            const isDone = !!completedActions[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleAction(idx)}
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isDone
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through opacity-70'
                    : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:border-slate-700'
                }`}
              >
                {isDone ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                )}
                <span className="text-xs">{action}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
