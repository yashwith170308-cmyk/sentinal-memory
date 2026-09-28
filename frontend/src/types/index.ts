export interface Alert {
  alert_id: string;
  host: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  process: string;
  parent_process: string;
  command: string;
  destination?: string;
  timestamp?: string;
  user?: string;
  raw_log?: string;
}

export interface DemoAlert {
  id: string;
  name: string;
  description: string;
  category: string;
  expected_behavior: string;
  alert: Alert;
}

export interface HistoricalMatch {
  memory_id: string;
  incident_id: string;
  title?: string;
  similarity_reason: string;
  historical_outcome: string;
  confidence_score?: number;
  tags?: string[];
  timestamp?: string;
  text?: string;
}

export interface InvestigationResult {
  alert_id: string;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  confidence: number;
  summary: string;
  key_indicators: string[];
  historical_matches: HistoricalMatch[];
  reasoning: string[];
  recommended_actions: string[];
  memory_used: boolean;
  memory_count: number;
  memory_status: 'CONNECTED' | 'UNAVAILABLE' | 'NO_RELEVANT_MEMORIES';
  hindsight_reflection?: string;
  execution_time_ms?: number;
  investigation_id?: string;
}

export interface FeedbackInput {
  alert_id: string;
  investigation_id?: string;
  verdict: 'CORRECT' | 'FALSE_POSITIVE' | 'ESCALATE' | 'NEEDS_REVIEW';
  comments: string;
  analyst_name?: string;
  action_taken?: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedback_id: string;
  alert_id: string;
  retained_in_hindsight: boolean;
  hindsight_operation_id?: string;
  message: string;
}

export interface IncidentItem {
  id: string;
  type: 'HISTORICAL_INCIDENT' | 'INVESTIGATED_ALERT';
  title: string;
  severity: string;
  category: string;
  host: string;
  process: string;
  outcome: string;
  timestamp: string;
  verdict?: string;
  memory_used?: boolean;
  tags: string[];
}

export interface MemoryStats {
  hindsight_connected: boolean;
  bank_id: string;
  base_url: string;
  total_incidents_seeded: number;
  retained_feedbacks_count: number;
  true_positives_recorded: number;
  false_positives_learned: number;
  active_patterns: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'INCIDENT' | 'TECHNIQUE' | 'HOST' | 'INDICATOR' | 'OUTCOME' | 'FEEDBACK';
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface MemoryGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface ComparisonScenario {
  alert: {
    id: string;
    title: string;
    host: string;
    command: string;
  };
  without_memory: {
    risk_level: string;
    confidence: number;
    status: string;
    summary: string;
    reasoning: string[];
    recommended_actions: string[];
    consequences: string;
  };
  with_hindsight_memory: {
    risk_level: string;
    confidence: number;
    status: string;
    historical_context: string;
    summary: string;
    reasoning: string[];
    recommended_actions: string[];
    consequences: string;
  };
}
