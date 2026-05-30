import { HealthInsightsContext } from '@/lib/buildHealthInsightsContext';
import {
  getGeminiApiKey,
  getHealthInsightsProxyUrl,
  HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
  HEALTH_INSIGHTS_MODEL,
  isHealthInsightsConfigured,
} from '@/lib/healthInsightsConfig';
import { parseModelJson } from '@/lib/parseModelJson';
import { HealthLlmInsight } from '@/types/healthInsights';

const SYSTEM_PROMPT = `You are a supportive wellness coach inside a personal health app.

You receive JSON with:
- whatYouEntered: facts the user typed or logged (profile, today's body feeling word, check-in scores 1–5, symptoms, routine done today, uploaded document names, recent daily check-ins, data methods they picked)
- wantsToImprove: areas they chose in onboarding and their own words for why
- optionalDerivedFromEnteredMeasurements: BMI from weight/height — NOT a goal they set

CRITICAL — accuracy:
- Reference todaysBodyFeeling (e.g. Weak, Energized) and today's check-in when present.
- uploadedDocuments lists file names only — do not invent lab values from them.
- Scores energy, sleepQuality, stress are 1–5 (5 is best for energy/sleep; stress is lower-is-better).
- Never invent sleep-hour goals, water targets, or calories. Not medical advice. Plain language.
- Medical conditions: cautious habits only. No diagnosis or medication advice.

Respond with JSON only:
{
  "insights": string[] — 2–3 short observations connecting their feeling, check-in, history, and goals,
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

function geminiTextFromResponse(data: {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}): string {
  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    throw new Error('Empty model response');
  }

  const text = candidate.content.parts
    .map((part) => part.text?.trim())
    .filter((t): t is string => Boolean(t))
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Empty model response');
  }

  if (candidate.finishReason === 'MAX_TOKENS') {
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

async function fetchViaGemini(context: HealthInsightsContext): Promise<HealthLlmInsight> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('Gemini API key not configured');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${HEALTH_INSIGHTS_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `User health data (JSON):\n${JSON.stringify(context, null, 2)}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
        responseMimeType: 'application/json',
        responseSchema: INSIGHT_RESPONSE_SCHEMA,
        // Thinking models (e.g. gemini-3.x) otherwise burn the token budget before JSON is finished.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    const message = errBody?.error?.message ?? `Gemini request failed (${res.status})`;
    throw new Error(message);
  }

  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      finishReason?: string;
    }[];
  };

  const text = geminiTextFromResponse(data);
  return parseInsightPayload(parseModelJson(text));
}

export async function fetchHealthInsights(context: HealthInsightsContext): Promise<HealthLlmInsight> {
  if (!isHealthInsightsConfigured()) {
    throw new Error('AI insights are not configured');
  }
  if (getHealthInsightsProxyUrl()) {
    return fetchViaProxy(context);
  }
  return fetchViaGemini(context);
}
