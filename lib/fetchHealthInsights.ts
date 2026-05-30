import { HealthInsightsContext } from '@/lib/buildHealthInsightsContext';
import {
  getHealthInsightsProxyUrl,
  getOpenAiApiKey,
  HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
  HEALTH_INSIGHTS_MODEL,
  HEALTH_INSIGHTS_TEMPERATURE,
  isHealthInsightsConfigured,
} from '@/lib/healthInsightsConfig';
import { parseModelJson } from '@/lib/parseModelJson';
import { HealthLlmInsight } from '@/types/healthInsights';

const SYSTEM_PROMPT = `You are a supportive wellness coach inside a personal health app.

You receive JSON with:
- whatYouEntered: facts the user typed or chose (profile, their 4-week plan, uploaded document names, data methods they picked)
- wantsToImprove: areas they chose in onboarding and their own words for why
- optionalDerivedFromEnteredMeasurements: BMI from weight/height — NOT a goal they set

CRITICAL — accuracy:
- personalPlan describes their active adaptive plan and current week focus.
- Daily check-in answers are NOT included — do not invent or assume what they logged today.
- Never invent sleep-hour goals, water targets, or calories. Not medical advice. Plain language.
- Medical conditions: cautious habits only. No diagnosis or medication advice.

Respond with JSON only:
{
  "insights": string[] — 2–3 short observations connecting their plan and goals,
  "recommendations": string[] — 3–4 practical next steps for today or this week,
  "questions": string[] — 2–3 thoughtful questions they can reflect on (not yes/no)
}`;

const INSIGHT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    insights: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['insights', 'recommendations', 'questions'],
  additionalProperties: false,
};

function parseStringList(raw: unknown, field: string, max: number): string[] {
  if (!Array.isArray(raw)) {
    throw new Error(`Insight response missing ${field}`);
  }
  const items = raw
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => t.trim())
    .slice(0, max);
  if (items.length === 0) {
    throw new Error(`Insight response had no ${field}`);
  }
  return items;
}

function parseInsightPayload(raw: unknown): HealthLlmInsight {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid insight response');
  }
  const obj = raw as Record<string, unknown>;
  const legacyTips = obj.tips;
  if (Array.isArray(legacyTips) && legacyTips.length > 0) {
    const tips = parseStringList(legacyTips, 'tips', 6);
    return {
      insights: tips.slice(0, 3),
      recommendations: tips.slice(0, 4),
      questions: ['What felt most true about your body today?'],
    };
  }
  return {
    insights: parseStringList(obj.insights, 'insights', 4),
    recommendations: parseStringList(obj.recommendations, 'recommendations', 5),
    questions: parseStringList(obj.questions, 'questions', 4),
  };
}

function openAiTextFromResponse(data: {
  choices?: {
    message?: { content?: string | null };
    finish_reason?: string;
  }[];
}): string {
  const choice = data.choices?.[0];
  const text = choice?.message?.content?.trim();

  if (!text) {
    throw new Error('Empty model response');
  }

  if (choice?.finish_reason === 'length') {
    throw new Error('Response was cut off. Tap Refresh to try again.');
  }

  return text;
}

async function fetchViaProxy(context: HealthInsightsContext): Promise<HealthLlmInsight> {
  const url = getHealthInsightsProxyUrl();
  if (!url) throw new Error('Proxy URL not configured');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ context }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Insights request failed (${res.status})`);
  }

  const data: unknown = await res.json();
  return parseInsightPayload(data);
}

async function fetchViaOpenAi(context: HealthInsightsContext): Promise<HealthLlmInsight> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: HEALTH_INSIGHTS_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `User health data (JSON):\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      temperature: HEALTH_INSIGHTS_TEMPERATURE,
      max_completion_tokens: HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'health_insights',
          strict: true,
          schema: INSIGHT_RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    const message = errBody?.error?.message ?? `OpenAI request failed (${res.status})`;
    throw new Error(message);
  }

  const data = (await res.json()) as {
    choices?: {
      message?: { content?: string | null };
      finish_reason?: string;
    }[];
  };

  const text = openAiTextFromResponse(data);
  return parseInsightPayload(parseModelJson(text));
}

export async function fetchHealthInsights(context: HealthInsightsContext): Promise<HealthLlmInsight> {
  if (!isHealthInsightsConfigured()) {
    throw new Error('AI insights are not configured');
  }
  if (getHealthInsightsProxyUrl()) {
    return fetchViaProxy(context);
  }
  return fetchViaOpenAi(context);
}
