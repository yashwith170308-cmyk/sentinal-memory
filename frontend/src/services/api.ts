import {
  Alert,
  DemoAlert,
  InvestigationResult,
  FeedbackInput,
  FeedbackResponse,
  IncidentItem,
  MemoryStats,
  MemoryGraph,
  ComparisonScenario
} from '../types';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
let targetBase = rawApiUrl;
if (!targetBase && typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
  // Direct calls to the deployed backend when running on any Vercel domain
  if (!window.location.hostname.includes('backend-phi-ten-29')) {
    targetBase = 'https://backend-phi-ten-29.vercel.app/api';
  }
}
const API_BASE = targetBase
  ? (targetBase.endsWith('/api') ? targetBase : `${targetBase.replace(/\/+$/, '')}/api`)
  : '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  },

  async getPrebuiltAlerts(): Promise<DemoAlert[]> {
    const res = await fetch(`${API_BASE}/alerts/prebuilt`);
    if (!res.ok) throw new Error('Failed to fetch prebuilt alerts');
    return res.json();
  },

  async investigateAlert(alert: Alert): Promise<InvestigationResult> {
    const res = await fetch(`${API_BASE}/alerts/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
    if (!res.ok) {
      let message = 'Investigation failed';
      try {
        const err = await res.json();
        message = err.detail || err.message || message;
      } catch {
        const text = await res.text().catch(() => '');
        if (text) {
          message = text.length > 150 ? `${text.slice(0, 150)}...` : text;
        }
      }
      throw new Error(message);
    }
    return res.json();
  },

  async submitFeedback(feedback: FeedbackInput): Promise<FeedbackResponse> {
    const res = await fetch(`${API_BASE}/alerts/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Feedback submission failed' }));
      throw new Error(err.detail || 'Feedback submission failed');
    }
    return res.json();
  },

  async getIncidents(): Promise<IncidentItem[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncidentDetail(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch incident details');
    return res.json();
  },

  async searchMemory(query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/memory/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search memory');
    return res.json();
  },

  async getMemoryStats(): Promise<MemoryStats> {
    const res = await fetch(`${API_BASE}/memory/stats`);
    if (!res.ok) throw new Error('Failed to fetch memory stats');
    return res.json();
  },

  async getMemoryGraph(): Promise<MemoryGraph> {
    const res = await fetch(`${API_BASE}/memory/graph`);
    if (!res.ok) throw new Error('Failed to fetch memory graph');
    return res.json();
  },

  async getComparison(): Promise<ComparisonScenario> {
    const res = await fetch(`${API_BASE}/demo/comparison`);
    if (!res.ok) throw new Error('Failed to fetch demo comparison');
    return res.json();
  },

  async triggerSeed(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed memory');
    return res.json();
  },

  async resetDemo(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo');
    return res.json();
  },

  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
