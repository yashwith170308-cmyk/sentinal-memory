import React, { useState } from 'react';
import { Check, X, ShieldAlert, AlertTriangle, Send, Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { FeedbackInput, FeedbackResponse } from '../types';
import { api } from '../services/api';

interface FeedbackPanelProps {
  alertId: string;
  investigationId?: string;
  onFeedbackSubmitted?: (res: FeedbackResponse) => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  alertId,
  investigationId,
  onFeedbackSubmitted
}) => {
  const [verdict, setVerdict] = useState<'CORRECT' | 'FALSE_POSITIVE' | 'ESCALATE' | 'NEEDS_REVIEW'>('CORRECT');
  const [comments, setComments] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: FeedbackInput = {
        alert_id: alertId,
        investigation_id: investigationId,
        verdict,
        comments,
        analyst_name: 'Lead SOC Analyst',
        action_taken: actionTaken || (verdict === 'CORRECT' ? 'Approved response playbook' : 'Whitelisted pattern in EDR')
      };

      const res = await api.submitFeedback(payload);
      setFeedbackResult(res);
      if (onFeedbackSubmitted) onFeedbackSubmitted(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPreset = (type: 'fp_backup' | 'tp_phish') => {
    if (type === 'fp_backup') {
      setVerdict('FALSE_POSITIVE');
      setComments('This was an authorized quarterly document archiver execution. The script is legitimate and approved by IT Engineering.');
      setActionTaken('Whitelisted script path in corporate EDR');
    } else {
      setVerdict('CORRECT');
      setComments('Confirmed malicious macro dropper. Host isolated and user credentials revoked.');
      setActionTaken('Quarantined host and blocked external C2 IP at firewall');
    }
  };

  return (
    <div className="rounded-xl border border-sky-500/20 bg-gradient-to-b from-[#0a1220]/95 to-[#070b14]/95 p-5 shadow-xl shadow-sky-950/20">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-mono">
              ANALYST FEEDBACK & HINDSIGHT RETENTION LOOP
            </h4>
            <p className="text-[11px] text-slate-400">
              Submit your verdict to train Sentinel Memory. Hindsight will retain this experience for future investigations.
            </p>
          </div>
        </div>

        {/* Quick Demo Pre-fills */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">QUICK PRESETS:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('fp_backup')}
            className="px-2 py-1 rounded bg-amber-950/40 border border-amber-600/40 text-amber-300 text-[11px] hover:bg-amber-900/50"
          >
            Mark False Positive
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('tp_phish')}
            className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-[11px] hover:bg-emerald-900/50"
          >
            Confirm Malicious
          </button>
        </div>
      </div>

      {feedbackResult ? (
        <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-emerald-300">Feedback Stored in Hindsight Memory</span>
          </div>
          <p className="text-xs text-slate-300 mb-2">{feedbackResult.message}</p>
          <div className="text-[11px] font-mono text-emerald-400/90 flex flex-wrap gap-3">
            <span>Feedback ID: {feedbackResult.feedback_id}</span>
            <span>Alert: {feedbackResult.alert_id}</span>
            {feedbackResult.hindsight_operation_id && (
              <span>Hindsight Op: {feedbackResult.hindsight_operation_id}</span>
            )}
          </div>
          <button
            onClick={() => {
              setFeedbackResult(null);
              setComments('');
            }}
            className="mt-3 text-xs text-sky-400 hover:text-sky-300 underline block"
          >
            Submit additional feedback on this alert
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Verdict Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider font-mono">
              Was this assessment accurate?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setVerdict('CORRECT')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  verdict === 'CORRECT'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Correct / Valid</span>
              </button>

              <button
                type="button"
                onClick={() => setVerdict('FALSE_POSITIVE')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  verdict === 'FALSE_POSITIVE'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>False Positive</span>
              </button>

              <button
                type="button"
                onClick={() => setVerdict('ESCALATE')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  verdict === 'ESCALATE'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Escalate Threat</span>
              </button>

              <button
                type="button"
                onClick={() => setVerdict('NEEDS_REVIEW')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  verdict === 'NEEDS_REVIEW'
                    ? 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-md shadow-sky-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Needs Review</span>
              </button>
            </div>
          </div>

          {/* Comment input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
              Analyst Rationale & Organizational Context:
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g., 'This was a false positive. The PowerShell command came from our approved backup system EnterpriseBackup.'"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          {/* Action Taken */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
              Response Action Taken:
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Whitelisted script hash; Quarantined workstation FINANCE-PC-17; Reset user credentials"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400">{errorMsg}</p>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !comments.trim()}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-sky-900/30 transition-all font-mono"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>RETAINING IN HINDSIGHT...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>COMMIT TO HINDSIGHT MEMORY</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
