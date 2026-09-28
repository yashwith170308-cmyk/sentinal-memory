import React, { useState, useEffect } from 'react';
import {
  Settings, Key, Database, Sparkles, CheckCircle2, AlertTriangle,
  RefreshCw, Loader2, Save, RotateCcw
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [hindsightApiKey, setHindsightApiKey] = useState('');
  const [hindsightBaseUrl, setHindsightBaseUrl] = useState('https://api.hindsight.vectorize.io');
  const [hindsightBankId, setHindsightBankId] = useState('sentinel-memory');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('llama-3.3-70b-versatile');

  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSettings();
      setCurrentConfig(data);
      if (data.hindsight) {
        setHindsightBaseUrl(data.hindsight.base_url || 'https://api.hindsight.vectorize.io');
        setHindsightBankId(data.hindsight.bank_id || 'sentinel-memory');
      }
      if (data.llm) {
        setLlmModel(data.llm.model || 'llama-3.3-70b-versatile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const payload: any = {};
      if (hindsightApiKey.trim()) payload.hindsight_api_key = hindsightApiKey.trim();
      if (hindsightBaseUrl.trim()) payload.hindsight_base_url = hindsightBaseUrl.trim();
      if (hindsightBankId.trim()) payload.hindsight_bank_id = hindsightBankId.trim();
      if (groqApiKey.trim()) payload.groq_api_key = groqApiKey.trim();
      if (llmModel.trim()) payload.llm_model = llmModel.trim();

      const updated = await api.updateSettings(payload);
      setCurrentConfig(updated);
      setSaveMessage('Settings updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await api.triggerSeed();
      setSeedMessage(res.message || 'Memory bank seeded successfully!');
      fetchSettings();
    } catch (err: any) {
      setSeedMessage(`Seeding error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 mb-1">
          <Settings className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-bold text-white font-mono">
            SENTINEL SYSTEM & CREDENTIAL SETTINGS
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Configure Vectorize Hindsight API parameters and LLM model credentials.
        </p>
      </div>

      {/* Live Service Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hindsight Status */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              HINDSIGHT CLIENT STATUS
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              currentConfig?.hindsight?.status === 'CONNECTED'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
            }`}>
              {currentConfig?.hindsight?.status || 'STANDBY'}
            </span>
          </div>
          <div className="text-xs text-slate-300 font-mono space-y-1">
            <div>Base URL: {currentConfig?.hindsight?.base_url}</div>
            <div>Bank ID: {currentConfig?.hindsight?.bank_id}</div>
            <div>API Key: {currentConfig?.hindsight?.has_api_key ? '✓ Configured' : '✕ Not Set'}</div>
          </div>
          {currentConfig?.hindsight?.reason && (
            <p className="text-[11px] text-amber-400/90 pt-1 border-t border-slate-800">
              Note: {currentConfig.hindsight.reason}
            </p>
          )}
        </div>

        {/* LLM Status */}
        <div className="glass-panel p-4 rounded-xl border border-sky-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              LLM INFERENCE ENGINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950/80 border border-indigo-500/50 text-indigo-300">
              {currentConfig?.llm?.status || 'READY'}
            </span>
          </div>
          <div className="text-xs text-slate-300 font-mono space-y-1">
            <div>Provider: {currentConfig?.llm?.provider}</div>
            <div>Model: {currentConfig?.llm?.model}</div>
            <div>Groq Key: {currentConfig?.llm?.has_api_key ? '✓ Configured' : '✕ Fallback Engine Active'}</div>
          </div>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Fallback heuristic defensive reasoning engine active when key is absent.
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-sky-500/25 space-y-5">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider border-b border-slate-800 pb-2">
          Update Runtime Credentials
        </h3>

        {/* Hindsight Settings */}
        <div className="space-y-4">
          <span className="text-xs font-mono font-bold text-sky-400 block uppercase">
            1. Vectorize Hindsight Credentials
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Hindsight API Key (Optional for cloud bank)
              </label>
              <input
                type="password"
                value={hindsightApiKey}
                onChange={(e) => setHindsightApiKey(e.target.value)}
                placeholder={currentConfig?.hindsight?.has_api_key ? '••••••••••••••••' : 'Enter Hindsight API key'}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Hindsight Base URL
              </label>
              <input
                type="text"
                value={hindsightBaseUrl}
                onChange={(e) => setHindsightBaseUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Memory Bank ID
              </label>
              <input
                type="text"
                value={hindsightBankId}
                onChange={(e) => setHindsightBankId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* LLM Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-mono font-bold text-indigo-400 block uppercase">
            2. Groq LLM Inference
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Groq API Key
              </label>
              <input
                type="password"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                placeholder={currentConfig?.llm?.has_api_key ? '••••••••••••••••' : 'Enter Groq API key'}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {saveMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300">
            {saveMessage}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-mono font-bold text-white uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>SAVE SETTINGS</span>
          </button>
        </div>
      </form>

      {/* Memory Bank Actions */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider border-b border-slate-800 pb-2">
          Memory Bank Management & Seeding
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-200 block mb-0.5">
              Re-Seed Synthetic Incidents into Bank
            </span>
            <p className="text-[11px] text-slate-400">
              Populates the 9 synthetic MITRE ATT&CK incidents into the Hindsight memory bank via client.retain().
            </p>
          </div>

          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-white uppercase tracking-wider shrink-0 transition-all cursor-pointer border border-slate-700"
          >
            {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>SEED HINDSIGHT BANK</span>
          </button>
        </div>

        {seedMessage && (
          <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/40 text-xs text-sky-300">
            {seedMessage}
          </div>
        )}
      </div>
    </div>
  );
};
