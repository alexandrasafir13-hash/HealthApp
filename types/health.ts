export type InsightSeverity = 'low' | 'medium' | 'high';
export type InsightCategory = 'sleep' | 'recovery' | 'immunity' | 'stress' | 'activity';

export type SummaryTone = 'body' | 'metric' | 'sleep' | 'recovery' | 'immunity' | 'stress' | 'caution';

export interface MetricScaleConfig {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  display?: string;
  lowerIsBetter?: boolean;
  goodMin?: number;
  cautionMin?: number;
  goodMax?: number;
  cautionMax?: number;
}

export interface SummarySegment {
  text: string;
  tone?: SummaryTone;
  metric?: MetricScaleConfig;
}

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
  summaryHighlights?: SummarySegment[];
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

export type DataSourceKind = 'app' | 'device' | 'manual';

export interface DataSource {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  metrics: string[];
  kind: DataSourceKind;
  description?: string;
}

export interface DeviceCategoryGroup {
  id: string;
  title: string;
  devices: DataSource[];
}

export type CheckInPeriod = 'morning' | 'afternoon' | 'evening';

export interface PeriodCheckIn {
  feeling: string;
  symptoms: string[];
  submittedAt: string;
}

export interface DailyCheckIn {
  date: string;
  energy: number;
  sleepQuality?: number;
  stress?: number;
  symptoms: string[];
  periods?: Partial<Record<CheckInPeriod, PeriodCheckIn>>;
}

export interface BodyStatus {
  score: number;
  label: string;
  trend: 'improving' | 'stable' | 'declining';
  message: string;
}

export type TestResultKind = 'pdf' | 'image';

export interface TestResultUpload {
  id: string;
  name: string;
  uri: string;
  kind: TestResultKind;
  uploadedAt: string;
}
