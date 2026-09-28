import React from 'react';
import { Shield, Brain, Activity, History, Network, Sparkles, PlayCircle, Settings as SettingsIcon, Database } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hindsightConnected: boolean;
  bankId: string;
  llmProvider: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hindsightConnected,
  bankId,
  llmProvider
}) => {
  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: Activity },
    { id: 'investigation', label: 'Investigate Alert', icon: Shield },
    { id: 'incidents', label: 'Incident History', icon: History },
    { id: 'memory', label: 'Memory Explorer', icon: Database },
    { id: 'learning', label: 'Learning & Feedback', icon: Brain },
    { id: 'demo', label: '60s Judge Demo', icon: PlayCircle, highlight: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-sky-500/20 bg-[#070b14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <Shield className="w-5 h-5 text-white" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#070b14] flex items-center justify-center">
                <Brain className="w-2.5 h-2.5 text-black" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono">
                  SENTINEL<span className="text-sky-400 font-sans ml-1">MEMORY</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-mono">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                "Your security team shouldn't have to rediscover the same attack twice."
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {/* Hindsight Status */}
            <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-full border ${
              hindsightConnected 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${hindsightConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-mono">Hindsight:</span>
              <span className="font-semibold">{hindsightConnected ? 'CONNECTED' : 'UNAVAILABLE'}</span>
            </div>

            {/* Bank ID */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              <Database className="w-3 h-3 text-sky-400" />
              <span className="text-slate-500">Bank:</span>
              <span>{bankId}</span>
            </div>

            {/* LLM Engine */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-slate-500">AI:</span>
              <span>{llmProvider}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-t border-slate-800/60 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                    : item.highlight
                    ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    JUDGE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
