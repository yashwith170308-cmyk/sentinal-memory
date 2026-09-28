import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { IncidentHistoryPage } from './pages/IncidentHistoryPage';
import { MemoryExplorerPage } from './pages/MemoryExplorerPage';
import { LearningPage } from './pages/LearningPage';
import { DemoPage } from './pages/DemoPage';
import { SettingsPage } from './pages/SettingsPage';
import { DemoAlert } from './types';
import { api } from './services/api';
import { Shield, Brain, Heart, ExternalLink } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedAlertForInvestigation, setSelectedAlertForInvestigation] = useState<DemoAlert | null>(null);

  // Health state
  const [hindsightConnected, setHindsightConnected] = useState<boolean>(false);
  const [bankId, setBankId] = useState<string>('sentinel-memory');
  const [llmProvider, setLlmProvider] = useState<string>('Heuristic SOC');

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setHindsightConnected(data.hindsight?.connected || false);
      setBankId(data.hindsight?.bank_id || 'sentinel-memory');
      setLlmProvider(data.llm?.provider || 'Defensive SOC Engine');
    } catch (err) {
      console.error('Health check failed', err);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectAlert = (alert: DemoAlert) => {
    setSelectedAlertForInvestigation(alert);
    setActiveTab('investigation');
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Navbar with live status */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hindsightConnected={hindsightConnected}
        bankId={bankId}
        llmProvider={llmProvider}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onSelectAlert={handleSelectAlert}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'investigation' && (
          <InvestigationPage initialAlert={selectedAlertForInvestigation} />
        )}

        {activeTab === 'incidents' && <IncidentHistoryPage />}

        {activeTab === 'memory' && <MemoryExplorerPage />}

        {activeTab === 'learning' && (
          <LearningPage onNavigateToInvestigation={() => setActiveTab('investigation')} />
        )}

        {activeTab === 'demo' && <DemoPage />}

        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* SOC Footer */}
      <footer className="border-t border-slate-900 bg-[#05070d] py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="text-slate-400 font-bold">SENTINEL MEMORY</span>
            <span>—</span>
            <span>HackWithHyderabad 3.0</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-[11px] text-slate-500">
              Persistent Memory Layer: <strong className="text-slate-400">Vectorize Hindsight</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500">
              Synthetic Enterprise SOC Dataset
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
