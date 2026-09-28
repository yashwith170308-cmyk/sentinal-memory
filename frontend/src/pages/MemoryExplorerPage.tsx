import React, { useState, useEffect } from 'react';
import {
  Database, Search, Network, Brain, Sparkles, Filter,
  Share2, ArrowRight, Loader2, CheckCircle2, Shield
} from 'lucide-react';
import { MemoryGraph, MemoryStats } from '../types';
import { api } from '../services/api';

export const MemoryExplorerPage: React.FC = () => {
  const [graphData, setGraphData] = useState<MemoryGraph | null>(null);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeNodeType, setActiveNodeType] = useState<string>('ALL');

  // Reflect query state
  const [reflectQuery, setReflectQuery] = useState('What recurring patterns or approved false positives exist for Word spawning PowerShell?');
  const [reflectOutput, setReflectOutput] = useState<string | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getMemoryGraph(),
      api.getMemoryStats()
    ]).then(([gData, sData]) => {
      setGraphData(gData);
      setStats(sData);
    }).catch(console.error);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await api.searchMemory(searchQuery);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReflect = async () => {
    if (!reflectQuery.trim()) return;
    setIsReflecting(true);
    setReflectOutput(null);
    try {
      const res = await fetch(`/api/memory/reflect?query=${encodeURIComponent(reflectQuery)}`, {
        method: 'POST'
      });
      const data = await res.json();
      setReflectOutput(data.reflection || 'No reflection synthesized.');
    } catch (err: any) {
      setReflectOutput('Reflection synthesis unavailable.');
    } finally {
      setIsReflecting(false);
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'INCIDENT': return 'border-sky-500/60 bg-sky-950/40 text-sky-300';
      case 'TECHNIQUE': return 'border-purple-500/60 bg-purple-950/40 text-purple-300';
      case 'HOST': return 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300';
      case 'INDICATOR': return 'border-orange-500/60 bg-orange-950/40 text-orange-300';
      case 'OUTCOME': return 'border-amber-500/60 bg-amber-950/40 text-amber-300';
      case 'FEEDBACK': return 'border-pink-500/60 bg-pink-950/40 text-pink-300';
      default: return 'border-slate-700 bg-slate-900 text-slate-300';
    }
  };

  const filteredNodes = graphData?.nodes.filter(n => {
    if (activeNodeType === 'ALL') return true;
    return n.type === activeNodeType;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            <span>HINDSIGHT MEMORY EXPLORER</span>
          </h2>
          <p className="text-xs text-slate-400">
            Inspect the organization's accumulated security memories, semantic entities, and relational graph.
          </p>
        </div>

        {/* Bank Badge */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            Bank: <strong className="text-sky-400">{stats?.bank_id || 'sentinel-memory'}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            Entities: <strong className="text-emerald-400">{graphData?.total_nodes || 24} Nodes</strong>
          </span>
        </div>
      </div>

      {/* Semantic Memory Search Bar */}
      <form onSubmit={handleSearch} className="glass-panel p-4 rounded-xl border border-sky-500/20">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query Hindsight memory e.g., 'Word spawning PowerShell false positive backup exceptions'..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-mono font-bold text-white uppercase tracking-wider shrink-0 transition-all cursor-pointer"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>RECALL MEMORIES</span>
          </button>
        </div>

        {/* Search Results Display */}
        {searchResults.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
            <span className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
              Recalled Memory Units ({searchResults.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((mem, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-sky-300 font-bold">{mem.document_id || mem.id}</span>
                    <span className="text-emerald-400 font-bold">Score: {Math.round((mem.score || 0.85) * 100)}%</span>
                  </div>
                  <p className="text-slate-300 leading-snug line-clamp-3">{mem.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Relational Memory Graph Explorer */}
      <div className="glass-panel p-5 rounded-xl border border-sky-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Institutional Security Graph (Incident ↔ Technique ↔ Host ↔ Outcome ↔ Feedback)
            </h3>
          </div>

          {/* Node Type Filters */}
          <div className="flex flex-wrap gap-1 text-[10px] font-mono">
            {['ALL', 'INCIDENT', 'TECHNIQUE', 'HOST', 'OUTCOME', 'FEEDBACK'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveNodeType(type)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  activeNodeType === type
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Graph Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-96 overflow-y-auto p-1">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              className={`p-2.5 rounded-lg border text-xs font-mono transition-all hover:scale-102 flex flex-col justify-between ${getNodeColor(node.type)}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-wider font-bold opacity-75">{node.type}</span>
              </div>
              <span className="font-semibold truncate text-[11px] block">{node.label}</span>
            </div>
          ))}
        </div>

        {/* Graph Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="text-slate-500 uppercase font-bold">LEGEND:</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /> Incident</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> Technique</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Host</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Outcome</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-400" /> Analyst Feedback</span>
        </div>
      </div>

      {/* Hindsight Reflect Sandbox */}
      <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-b from-[#0a1228]/80 to-[#070b16]/80 p-5 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-indigo-500/20 pb-3">
          <Brain className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white font-mono">
              HINDSIGHT REFLECT SYNTHESIZER
            </h3>
            <p className="text-[11px] text-slate-400">
              Trigger Hindsight's biomimetic reflection layer to formulate high-level organizational mental models.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={reflectQuery}
            onChange={(e) => setReflectQuery(e.target.value)}
            className="flex-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/30 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-400"
          />
          <button
            onClick={handleReflect}
            disabled={isReflecting || !reflectQuery.trim()}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-mono font-bold text-white uppercase tracking-wider shrink-0 transition-all cursor-pointer"
          >
            {isReflecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>SYNTHESIZE REFLECTION</span>
          </button>
        </div>

        {reflectOutput && (
          <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed font-sans">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 block mb-1">
              Synthesized Organizational Mental Model:
            </span>
            {reflectOutput}
          </div>
        )}
      </div>
    </div>
  );
};
