import { habitCatalog } from '@/data/onboardingOptions';
import { buildRoutineGenerationContext, RoutineGenerationContext } from '@/lib/buildRoutineContext';
import { buildFallbackRoutineProposals } from '@/lib/fallbackRoutine';
import {
  getHealthInsightsProxyUrl,
  getOpenAiApiKey,
  HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
  HEALTH_INSIGHTS_MODEL,
  HEALTH_INSIGHTS_TEMPERATURE,
  isHealthInsightsConfigured,
} from '@/lib/healthInsightsConfig';
import { parseModelJson } from '@/lib/parseModelJson';
import { UserProfile } from '@/types/onboarding';
import {
  ROUTINE_OPTION_COUNT,
  RoutineOption,
  RoutineProposalSet,
  RoutineStep,
} from '@/types/routine';

const ROUTINE_MAX_OUTPUT_TOKENS = Math.max(HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS, 2048);

const ROUTINE_OPTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    primaryGoalId: { type: 'string' },
    whyThisGoal: { type: 'string' },
    intro: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          timeHint: { type: 'string' },
        },
        required: ['title', 'description', 'timeHint'],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 5,
    },
  },
  required: ['id', 'primaryGoalId', 'whyThisGoal', 'intro', 'steps'],
  additionalProperties: false,
};

const ROUTINE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    options: {
      type: 'array',
      items: ROUTINE_OPTION_SCHEMA,
      minItems: ROUTINE_OPTION_COUNT,
      maxItems: ROUTINE_OPTION_COUNT,
    },
  },
  required: ['options'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a supportive wellness coach building starter daily routines for a new app user.

You receive JSON with the user's age, sex, weight, height, medical conditions, and wantsToImprove — goals they picked in onboarding plus their answers to follow-up questions.

Your job:
1. Propose exactly 3 distinct daily routines the user can choose from.
2. Each routine should feel meaningfully different — prioritize different goals from selectedGoalIds when the user picked multiple. If they picked only one goal, offer 3 distinct approaches (gentle, balanced, more structured).
3. For each routine, explain why that focus could help them and include 3–5 small, actionable daily items they can tick off each day.

Rules:
- Return exactly 3 options with unique id values (e.g. "routine-1", "routine-2", "routine-3").
- primaryGoalId on each option MUST be one of the ids in selectedGoalIds.
- Each step must be a concrete daily action the user can check off — start titles with a verb (e.g. "Drink a glass of water", "Take a 10-minute walk"). Not vague tips or advice.
- description should clarify how to do the action in one sentence.
- Use plain language. Not medical advice. No diagnosis or medication suggestions.
- Be cautious with medical conditions — gentle habits only.
- timeHint should be short (e.g. "Morning", "Before bed", "After lunch").
- Do not invent goals they did not select.

Respond with JSON only:
{
  "options": [
    {
      "id": string,
      "primaryGoalId": string,
      "whyThisGoal": string,
      "intro": string,
      "steps": [{ "title": string, "description": string, "timeHint": string }]
    }
  ]
}`;

function parseSteps(raw: unknown): RoutineStep[] {
  if (!Array.isArray(raw)) throw new Error('Routine response missing steps');
  const steps = raw
    .filter(
      (item): item is RoutineStep =>
        item != null &&
        typeof item === 'object' &&
        typeof (item as RoutineStep).title === 'string' &&
        typeof (item as RoutineStep).description === 'string' &&
        typeof (item as RoutineStep).timeHint === 'string',
    )
    .map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
      timeHint: item.timeHint.trim(),
    }))
    .filter((item) => item.title && item.description && item.timeHint)
    .slice(0, 5);
  if (steps.length < 3) throw new Error('Routine response had too few steps');
  return steps;
}

function normalizeRoutineOption(raw: unknown, profile: UserProfile, index: number): RoutineOption {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid routine option');
  const obj = raw as Record<string, unknown>;
  const primaryGoalId = String(obj.primaryGoalId ?? '').trim();
  if (!profile.habitIds.includes(primaryGoalId)) {
    throw new Error('Routine picked an invalid goal');
  }
  const whyThisGoal = String(obj.whyThisGoal ?? '').trim();
  const intro = String(obj.intro ?? '').trim();
  const id = String(obj.id ?? `routine-${index + 1}`).trim() || `routine-${index + 1}`;
  if (!whyThisGoal || !intro) throw new Error('Routine response missing copy');

  const habit = habitCatalog.find((h) => h.id === primaryGoalId);
  return {
    id,
    primaryGoalId,
    primaryGoalTitle: habit?.title ?? primaryGoalId,
    whyThisGoal,
    intro,
    steps: parseSteps(obj.steps),
  };
}

function normalizeRoutineProposals(raw: unknown, profile: UserProfile): RoutineOption[] {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid routine response');
  const obj = raw as Record<string, unknown>;
  const optionsRaw = (obj.options ?? obj.routines) as unknown;
  if (!Array.isArray(optionsRaw)) throw new Error('Routine response missing options');

  const options = optionsRaw
    .slice(0, ROUTINE_OPTION_COUNT)
    .map((item, index) => normalizeRoutineOption(item, profile, index));

  if (options.length < ROUTINE_OPTION_COUNT) {
    throw new Error('Routine response had too few options');
  }

  return options;
}

async function fetchViaProxy(
  context: RoutineGenerationContext,
  profile: UserProfile,
): Promise<RoutineOption[]> {
  const url = getHealthInsightsProxyUrl();
  if (!url) throw new Error('Proxy URL not configured');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ context, kind: 'routine' }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Routine request failed (${res.status})`);
  }

  const data: unknown = await res.json();
  if (!data || typeof data !== 'object') throw new Error('Invalid routine response');
  const payload = (data as Record<string, unknown>).options
    ? data
    : (data as Record<string, unknown>).routine ?? data;
  return normalizeRoutineProposals(payload, profile);
}

async function fetchViaOpenAi(
  context: RoutineGenerationContext,
  profile: UserProfile,
): Promise<RoutineOption[]> {
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
          content: `User onboarding data (JSON):\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      temperature: HEALTH_INSIGHTS_TEMPERATURE,
      max_completion_tokens: ROUTINE_MAX_OUTPUT_TOKENS,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'routine_proposals',
          strict: true,
          schema: ROUTINE_RESPONSE_SCHEMA,
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
    choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty model response');
  if (data.choices?.[0]?.finish_reason === 'length') {
    throw new Error('Routine response was cut off');
  }

  return normalizeRoutineProposals(parseModelJson(text), profile);
}

export async function generateRoutineProposals(profile: UserProfile): Promise<RoutineProposalSet> {
  const context = buildRoutineGenerationContext(profile);

  if (isHealthInsightsConfigured()) {
    try {
      if (getOpenAiApiKey()) {
        const options = await fetchViaOpenAi(context, profile);
        return {
          options,
          generatedAt: new Date().toISOString(),
          source: 'llm',
        };
      }
      if (getHealthInsightsProxyUrl()) {
        const options = await fetchViaProxy(context, profile);
        return {
          options,
          generatedAt: new Date().toISOString(),
          source: 'llm',
        };
      }
    } catch {
      // fall through to local templates
    }
  }

  return buildFallbackRoutineProposals(profile.habitIds, profile.goalDetails ?? {});
}
