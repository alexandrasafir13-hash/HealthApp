export interface HealthLlmInsight {
  insights: string[];
  recommendations: string[];
  questions: string[];
}

export interface HealthInsightsCacheEntry {
  fingerprint: string;
  insight: HealthLlmInsight;
  fetchedAt: string;
}
