import React from 'react';
import { Clock, ShieldAlert, History, MessageSquare, CheckCircle, ArrowDown } from 'lucide-react';
import { HistoricalMatch } from '../types';

interface IncidentTimelineProps {
  alertId: string;
  alertTimestamp?: string;
  historicalMatches: HistoricalMatch[];
  feedbackGiven?: string;
  recommendedActions: string[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  alertId,
  alertTimestamp,
  historicalMatches,
  feedbackGiven,
  recommendedActions
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#090e18]/80 p-5 shadow-lg">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
        <Clock className="w-4 h-4 text-sky-400" />
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          Temporal Incident & Memory Progression Timeline
        </h4>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {/* 1. Current Alert */}
        <div className="relative">
          <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="font-bold text-rose-300">CURRENT ALERT INGESTION</span>
              <span className="text-slate-500">{alertTimestamp || 'T: 00:00:00'}</span>
            </div>
            <p className="text-xs text-slate-300">
              Security telemetry received for <strong className="text-white font-mono">{alertId}</strong>. Initiating Hindsight memory retrieval query.
            </p>
          </div>
        </div>

        {/* 2. Historical Recalled Incidents */}
        {historicalMatches.map((m, idx) => (
          <div key={m.memory_id || idx} className="relative">
            <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-sky-500/20 border-2 border-sky-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>
            <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/25">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-sky-300">HISTORICAL MEMORY #{idx + 1}: {m.incident_id}</span>
                <span className="text-slate-500">{m.timestamp || 'Retained in Bank'}</span>
              </div>
              <p className="text-xs text-slate-300 mb-1">{m.similarity_reason}</p>
              <div className="text-[11px] text-emerald-400 font-mono">
                Past SOC Resolution: {m.historical_outcome}
              </div>
            </div>
          </div>
        ))}

        {/* 3. Analyst Feedback Loop */}
        <div className="relative">
          <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="font-bold text-amber-300">SOC ANALYST FEEDBACK INTERACTION</span>
              <span className="text-slate-500">Continuous Learning Loop</span>
            </div>
            <p className="text-xs text-slate-300">
              {feedbackGiven ? (
                <span>Recorded Verdict: <strong className="text-amber-200">{feedbackGiven}</strong></span>
              ) : (
                <span>Analyst evaluation pending. Submitting feedback will reinforce Hindsight's future recall precision.</span>
              )}
            </p>
          </div>
        </div>

        {/* 4. Current Recommendation */}
        <div className="relative">
          <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="font-bold text-emerald-300">CONTEXT-AWARE DEFENSIVE RECOMMENDATION</span>
              <span className="text-emerald-400/80 font-bold">Active Playbook</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 mt-1 list-disc pl-4">
              {recommendedActions.slice(0, 3).map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
