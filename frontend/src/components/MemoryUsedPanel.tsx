import React, { useState } from 'react';
import {
  Database, Brain, Sparkles, ChevronDown, ChevronUp,
  CheckCircle2, History, Copy
} from 'lucide-react';
import { HistoricalMatch } from '../types';

interface MemoryUsedPanelProps {
  memoryUsed: boolean;
  memoryCount: number;
  memoryStatus: string;
  historicalMatches: HistoricalMatch[];
  reflectionSummary?: string;
  reasoning: string[];
  retainedSessionFeedback?: {
    feedbackId?: string;
    alertId?: string;
    opId?: string;
  } | null;
}

export const MemoryUsedPanel: React.FC<MemoryUsedPanelProps> = ({
  memoryUsed,
  memoryCount,
  memoryStatus,
  historicalMatches,
  reflectionSummary,
  reasoning,
  retainedSessionFeedback
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract memory-specific reasoning bullets
  const memoryReasoning = reasoning.filter(
    r => r.toUpperCase().includes('HISTORICAL') || r.toUpperCase().includes('MEMORY') || r.toUpperCase().includes('SYNTHESIS')
  );

  // Helper to determine if a recalled memory originated from the session's retained feedback
  const isFromCurrentSessionFeedback = (match: HistoricalMatch): boolean => {
    if (!retainedSessionFeedback || !retainedSessionFeedback.alertId) return false;
    const alertId = retainedSessionFeedback.alertId.toUpperCase();
    const fbId = retainedSessionFeedback.feedbackId ? retainedSessionFeedback.feedbackId.toUpperCase() : '';
    const opId = retainedSessionFeedback.opId ? retainedSessionFeedback.opId.toUpperCase() : '';

    const incId = (match.incident_id || '').toUpperCase();
    const text = (match.text || '').toUpperCase();
    const tags = (match.tags || []).map(t => t.toUpperCase());
    const outcome = (match.historical_outcome || '').toUpperCase();
    const reason = (match.similarity_reason || '').toUpperCase();

    const matchesAlert = incId.includes(alertId) || text.includes(alertId) || reason.includes(alertId) || outcome.includes(alertId);
    const matchesFb = fbId ? (text.includes(fbId) || incId.includes(fbId)) : false;
    const matchesOp = opId ? (match.memory_id.toUpperCase() === opId || text.includes(opId)) : false;
    const hasFeedbackTag = tags.includes('FEEDBACK') || tags.includes('ANALYST_VERDICT') || incId.includes('FEEDBACK');

    return Boolean((matchesAlert || matchesFb || matchesOp) && (hasFeedbackTag || text.includes('ANALYST VERDICT') || outcome.includes('FALSE POSITIVE')));
  };

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-b from-[#09151c]/90 to-[#070e14]/90 p-5 shadow-xl shadow-emerald-950/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold tracking-wide text-white font-mono">
                MEMORY USED IN THIS INVESTIGATION
              </h3>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                memoryUsed
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}>
                {memoryUsed ? `${memoryCount} MEMORIES RECALLED` : 'NO RELEVANT MEMORIES'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hindsight persistent institutional memory retrieved organizational precedent for this alert.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Key Value Proposition Callout */}
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-200/90 leading-relaxed">
              <strong className="text-emerald-300 font-medium">Why did the answer change? </strong>
              Sentinel matched this behavior against retained organizational memories, distinguishing between recognized IT exceptions and confirmed malicious campaigns based on how your SOC resolved them in the past.
            </div>
          </div>

          {/* Recalled Memory Cards Grid */}
          {historicalMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {historicalMatches.map((match, idx) => {
                const isRecentlyLearned = isFromCurrentSessionFeedback(match);
                const hasValidUUID = match.memory_id && match.memory_id.trim() !== '' && !match.memory_id.startsWith('mem-');

                return (
                  <div
                    key={match.memory_id || idx}
                    className={`rounded-lg border p-3.5 transition-all flex flex-col justify-between ${
                      isRecentlyLearned
                        ? 'bg-amber-950/25 border-amber-500/60 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30'
                        : 'bg-slate-900/70 border-emerald-500/25 hover:border-emerald-400/50'
                    }`}
                  >
                    <div>
                      {/* Card Header: Type Tag & Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-slate-800">
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 font-mono text-[10px] font-semibold">
                          <Database className="w-3 h-3 text-sky-400" />
                          <span>HINDSIGHT MEMORY</span>
                        </div>

                        {isRecentlyLearned && (
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/70 text-amber-300 font-mono text-[10px] font-bold">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>✨ RECALLED FROM STEP 3 FEEDBACK</span>
                            <span className="ml-1 px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[8px] font-black uppercase">
                              Recently learned
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Memory ID */}
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Memory ID:
                        </span>
                        {hasValidUUID ? (
                          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-sky-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                            <span title={match.memory_id}>
                              {match.memory_id.length > 18
                                ? `${match.memory_id.slice(0, 8)}...${match.memory_id.slice(-6)}`
                                : match.memory_id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(match.memory_id, e)}
                              className="text-[10px] text-slate-400 hover:text-white cursor-pointer ml-auto shrink-0 flex items-center space-x-1"
                              title="Copy full UUID"
                            >
                              {copiedId === match.memory_id ? (
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Not provided by Hindsight</span>
                        )}
                      </div>

                      {/* Recall Score */}
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Recall score:
                        </span>
                        {typeof match.confidence_score === 'number' ? (
                          <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded inline-block">
                            {match.confidence_score.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Not provided by Hindsight</span>
                        )}
                      </div>

                      {/* Relevant Incident */}
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Relevant incident:
                        </span>
                        {match.incident_id && match.incident_id !== 'INC-HIST' ? (
                          <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-sky-300">
                            <History className="w-3.5 h-3.5 text-sky-400" />
                            <span>{match.incident_id}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Not provided by Hindsight</span>
                        )}
                      </div>

                      {/* Historical Context (Actual Snippet) */}
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Historical context:
                        </span>
                        {match.text && match.text.trim() !== '' ? (
                          <div className="text-[11px] text-slate-300 leading-snug bg-slate-950/60 p-2 rounded border border-slate-800/80 font-mono max-h-24 overflow-y-auto">
                            {match.text}
                          </div>
                        ) : match.historical_outcome ? (
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {match.historical_outcome}
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Not provided by Hindsight</span>
                        )}
                      </div>

                      {/* Why Relevant */}
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Why relevant:
                        </span>
                        <p className="text-xs text-slate-200 leading-snug">
                          {match.similarity_reason}
                        </p>
                      </div>

                      {/* Historical Resolution */}
                      {match.historical_outcome && (
                        <div className="text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] font-semibold text-emerald-400/90 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Historical Resolution:
                          </span>
                          <p className="text-emerald-200/80 text-[11px] leading-snug">
                            {match.historical_outcome}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              {memoryStatus === 'UNAVAILABLE' ? (
                <span>Hindsight memory unavailable — investigation running without organizational memory.</span>
              ) : (
                <span>No matching historical incidents found in Hindsight memory bank for this pattern.</span>
              )}
            </div>
          )}

          {/* Reflection Synthesis if available */}
          {reflectionSummary && (
            <div className="p-3.5 rounded-lg bg-sky-950/30 border border-sky-500/20 text-xs">
              <span className="text-sky-300 font-semibold font-mono uppercase text-[10px] tracking-wider block mb-1">
                Hindsight Reflect Synthesis (Organizational Mental Model):
              </span>
              <p className="text-slate-300 leading-relaxed">{reflectionSummary}</p>
            </div>
          )}

          {/* How Memory Influenced This Investigation */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-2">
            <span className="text-slate-400 font-semibold font-mono uppercase text-[10px] tracking-wider block">
              How Memory Influenced This Investigation:
            </span>
            <ul className="space-y-1.5 text-slate-300">
              {memoryReasoning.length > 0 ? (
                memoryReasoning.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">
                  Standard baseline evaluation. No historical memory overrides applied.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
