/** OpenAI API key (dev/prototype — prefer a backend proxy in production). */
export function getOpenAiApiKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim();
  return key || undefined;
}

/** Optional POST endpoint that accepts `{ context }` and returns `{ summary, tips }`. */
export function getHealthInsightsProxyUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_HEALTH_INSIGHTS_API_URL?.trim();
  return url || undefined;
}

export function isHealthInsightsConfigured(): boolean {
  return getOpenAiApiKey() != null || getHealthInsightsProxyUrl() != null;
}

export const HEALTH_INSIGHTS_MODEL =
  process.env.EXPO_PUBLIC_OPENAI_MODEL?.trim() || 'gpt-5.4-nano';

export const HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS = Number(
  process.env.EXPO_PUBLIC_OPENAI_MAX_OUTPUT_TOKENS ?? 2048,
);

export const HEALTH_INSIGHTS_TEMPERATURE = Number(
  process.env.EXPO_PUBLIC_OPENAI_TEMPERATURE ?? 0.6,
);

export const HEALTH_INSIGHTS_REASONING_EFFORT =
  process.env.EXPO_PUBLIC_OPENAI_REASONING_EFFORT?.trim() || 'medium';
