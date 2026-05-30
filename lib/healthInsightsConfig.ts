/** Google Gemini API key (dev/prototype — prefer a backend proxy in production). */
export function getGeminiApiKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  return key || undefined;
}

/** Optional POST endpoint that accepts `{ context }` and returns `{ summary, tips }`. */
export function getHealthInsightsProxyUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_HEALTH_INSIGHTS_API_URL?.trim();
  return url || undefined;
}

export function isHealthInsightsConfigured(): boolean {
  return getGeminiApiKey() != null || getHealthInsightsProxyUrl() != null;
}

export const HEALTH_INSIGHTS_MODEL =
  process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || 'gemini-2.0-flash';

export const HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS = Number(
  process.env.EXPO_PUBLIC_GEMINI_MAX_OUTPUT_TOKENS ?? 1024,
);
