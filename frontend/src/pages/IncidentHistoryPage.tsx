import React, { useState, useEffect } from 'react';
import {
  History, Search, Filter, ShieldCheck, AlertCircle, ExternalLink,
  Tag, Clock, Database, CheckCircle2, ChevronRight
} from 'lucide-react';
import { IncidentItem } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

export const IncidentHistoryPage: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getIncidents().then((data) => {
      setIncidents(data);
      if (data.length > 0) setSelectedIncident(data[0]);
    }).finally(() => setIsLoading(false));
  }, []);

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || inc.severity.toUpperCase() === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <span>ORGANIZATIONAL INCIDENT HISTORY</span>
          </h2>
          <p className="text-xs text-slate-400">
            Institutional security knowledge retained in Hindsight memory bank.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search incidents, hosts, tags..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500 w-56"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Incident List & Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Incident Table / List */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 glass-panel rounded-xl">
              No incidents matching the current search criteria.
            </div>
          ) : (
            filtered.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isFP = inc.tags.includes('false_positive');
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500/50 shadow-md shadow-sky-950/30'
                      : 'glass-panel hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-sky-400">{inc.id}</span>
                      <SeverityBadge severity={inc.severity} size="sm" />
                      {isFP && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          FALSE POSITIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {inc.timestamp ? inc.timestamp.split('T')[0] : 'Historical'}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 mb-1">{inc.title}</h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Host: <strong className="text-slate-300">{inc.host}</strong></span>
                    <span>Process: <strong className="text-sky-300">{inc.process}</strong></span>
                    <span className="flex items-center text-sky-400 gap-0.5">
                      Inspect <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Selected Incident Detailed Inspection */}
        <div>
          {selectedIncident ? (
            <div className="glass-panel p-5 rounded-xl border border-sky-500/30 space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold font-mono text-white">
                    HINDSIGHT RECORD: {selectedIncident.id}
                  </span>
                </div>
                <SeverityBadge severity={selectedIncident.severity} size="sm" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-1">{selectedIncident.title}</h3>
                <span className="text-[11px] font-mono text-slate-400 block">
                  Category: {selectedIncident.category}
                </span>
              </div>

              {/* Host and Process Specs */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">HOST:</span>
                  <span className="text-white">{selectedIncident.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PROCESS:</span>
                  <span className="text-sky-400">{selectedIncident.process}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SOURCE:</span>
                  <span className="text-slate-300">{selectedIncident.type}</span>
                </div>
              </div>

              {/* Historical Resolution */}
              <div>
                <span className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Historical Resolution & SOC Outcome:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  {selectedIncident.outcome}
                </p>
              </div>

              {/* Tags */}
              <div>
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Hindsight Semantic Tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIncident.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-sky-300 border border-slate-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-xl">
              Select an incident to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
