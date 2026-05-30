export type InsightSeverity = 'low' | 'medium' | 'high';
export type InsightCategory = 'sleep' | 'recovery' | 'immunity' | 'stress' | 'activity';

/** Colored inline phrases for friendlier summary copy */
export type SummaryTone = 'body' | 'metric' | 'sleep' | 'recovery' | 'immunity' | 'stress' | 'caution';

export interface MetricScaleConfig {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  /** Shown in the pill (e.g. "−14%"). Falls back to formatted value + unit */
  display?: string;
  /** When true, lower values are better (e.g. % drop from baseline) */
  lowerIsBetter?: boolean;
  /** Higher is better: values >= goodMin → green. Default 7 */
  goodMin?: number;
  /** Higher is better: values >= cautionMin → orange. Default 5.5 */
  cautionMin?: number;
  /** Lower is better: values <= goodMax → green. Default 5 */
  goodMax?: number;
  /** Lower is better: values <= cautionMax → orange. Default 12 */
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
  /** Shown on generic “connect any…” cards */
  description?: string;
}

export interface DeviceCategoryGroup {
  id: string;
  title: string;
  devices: DataSource[];
}

export type CheckInPeriod = 'morning' | 'afternoon' | 'evening';

export interface PeriodCheckIn {
  /** User-facing feeling word, e.g. Weak, Drained, Steady, Strong, Energized. */
  feeling: string;
  symptoms: string[];
  submittedAt: string;
}

export interface DailyCheckIn {
  date: string;
  energy: number;
  /** Derived from morning check-in when logged. */
  sleepQuality?: number;
  /** Derived from evening check-in when logged. */
  stress?: number;
  symptoms: string[];
  /** Per-period check-ins keyed by local-time window (morning / afternoon / evening). */
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
