export type InsightSeverity = 'low' | 'medium' | 'high';
export type InsightCategory = 'sleep' | 'recovery' | 'immunity' | 'stress' | 'activity';

export interface HealthAction {
  id: string;
  title: string;
  description: string;
  duration?: string;
  priority: 1 | 2 | 3;
}

export interface BodyInsight {
  id: string;
  title: string;
  summary: string;
  category: InsightCategory;
  severity: InsightSeverity;
  cause: {
    headline: string;
    detail: string;
    signals: string[];
  };
  effect: {
    headline: string;
    detail: string;
    bodySignals: string[];
  };
  actions: HealthAction[];
  connectedMetrics: string[];
  confidence: number;
  detectedAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  metrics: string[];
}

export interface DailyCheckIn {
  date: string;
  energy: number;
  sleepQuality: number;
  stress: number;
  symptoms: string[];
}

export interface PreventionHabit {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  reason: string;
}

export interface BodyStatus {
  score: number;
  label: string;
  trend: 'improving' | 'stable' | 'declining';
  message: string;
}
