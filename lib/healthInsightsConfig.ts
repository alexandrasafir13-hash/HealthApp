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

function requiredEnv(value: string | undefined, names: string): string {
  if (value) return value;
  throw new Error(`Missing required environment variable: ${names}`);
}

const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL?.trim();
const OPENAI_CHAT_MODEL = process.env.EXPO_PUBLIC_OPENAI_CHAT_MODEL?.trim();
const OPENAI_TASK_MODEL = process.env.EXPO_PUBLIC_OPENAI_TASK_MODEL?.trim();

export const CHAT_MODEL =
  requiredEnv(
    OPENAI_CHAT_MODEL || OPENAI_MODEL,
    'EXPO_PUBLIC_OPENAI_CHAT_MODEL or EXPO_PUBLIC_OPENAI_MODEL',
  );

export const TASK_MODEL =
  requiredEnv(
    OPENAI_TASK_MODEL || OPENAI_MODEL,
    'EXPO_PUBLIC_OPENAI_TASK_MODEL or EXPO_PUBLIC_OPENAI_MODEL',
  );

export const HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS = Number(
  process.env.EXPO_PUBLIC_OPENAI_MAX_COMPLETION_TOKENS ??
  process.env.EXPO_PUBLIC_OPENAI_MAX_OUTPUT_TOKENS ??
  2048,
);

export const HEALTH_INSIGHTS_TEMPERATURE = Number(
  process.env.EXPO_PUBLIC_OPENAI_TEMPERATURE ?? 0.6,
);

export const CHAT_REASONING_EFFORT =
  process.env.EXPO_PUBLIC_OPENAI_CHAT_REASONING_EFFORT?.trim() || 'low';

export const TASK_REASONING_EFFORT =
  process.env.EXPO_PUBLIC_OPENAI_TASK_REASONING_EFFORT?.trim() || 'medium';
