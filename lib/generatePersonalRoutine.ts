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
import { assertDailyActions, looksLikeRoutineTip } from '@/lib/validateRoutineActions';
import { UserProfile } from '@/types/onboarding';
import {
  ROUTINE_OPTION_COUNT,
  RoutineDailyAction,
  RoutineOption,
  RoutineProposalSet,
} from '@/types/routine';

const ROUTINE_MAX_OUTPUT_TOKENS = Math.max(HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS, 2048);

const DAILY_ACTION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    doneWhen: { type: 'string' },
    timeHint: { type: 'string' },
  },
  required: ['title', 'doneWhen', 'timeHint'],
  additionalProperties: false,
};

const ROUTINE_OPTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    primaryGoalId: { type: 'string' },
    whyThisGoal: { type: 'string' },
    intro: { type: 'string' },
    overviewTips: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 4,
    },
    dailyActions: {
      type: 'array',
      items: DAILY_ACTION_SCHEMA,
      minItems: 3,
      maxItems: 5,
    },
  },
  required: ['id', 'primaryGoalId', 'whyThisGoal', 'intro', 'overviewTips', 'dailyActions'],
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

Your job: propose exactly 3 distinct daily routines. Each routine has TWO separate parts:

PART A — OVERVIEW (tips and context — NOT ticked off):
- whyThisGoal: 1–2 sentences on why this focus helps them
- intro: 1 sentence summary of the routine approach
- overviewTips: 2–4 short advice bullets (recommendations, context, encouragement). These are tips only.

PART B — DAILY CHECKLIST (binary tasks the user ticks off every day):
- dailyActions: 3–5 concrete tasks. Each must pass the CHECKBOX TEST: at the end of the day the user can honestly say "yes I did this" or "no I didn't".

CRITICAL — do NOT put tips in dailyActions:
BAD dailyActions (these belong in overviewTips instead):
- "Stay hydrated throughout the day"
- "Try to reduce screen time"
- "Focus on better sleep"
- "Remember to stretch"
- "Consider walking more"
- "Keep stress low"

GOOD dailyActions (specific, measurable, one-time per day):
- title: "Drink 1 glass of water after waking" | doneWhen: "You finished one full glass within 30 minutes of getting up." | timeHint: "Morning"
- title: "Walk 10 minutes after lunch" | doneWhen: "You walked at least 10 minutes after your midday meal." | timeHint: "After lunch"
- title: "Put phone on charger outside bedroom" | doneWhen: "Your phone is charging outside the bedroom before you get into bed." | timeHint: "Before bed"

dailyActions rules:
- title: imperative verb first, max 10 words, include amount/duration/when when possible
- doneWhen: one sentence describing how they know it's complete — NOT why it's good for them
- timeHint: short (e.g. "Morning", "Before bed", "After lunch")
- Never duplicate overviewTips as dailyActions

Other rules:
- Return exactly 3 options with unique id values (routine-1, routine-2, routine-3)
- primaryGoalId MUST be one of selectedGoalIds
- Plain language. Not medical advice. No diagnosis or medication suggestions.
- Be cautious with medical conditions — gentle habits only.
- Do not invent goals they did not select.

Respond with JSON only:
{
  "options": [{
    "id": string,
    "primaryGoalId": string,
    "whyThisGoal": string,
    "intro": string,
    "overviewTips": string[],
    "dailyActions": [{ "title": string, "doneWhen": string, "timeHint": string }]
  }]
}`;

function parseOverviewTips(raw: unknown, whyThisGoal: string): string[] {
  if (Array.isArray(raw)) {
    const tips = raw
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, 4);
    if (tips.length >= 2) return tips;
  }
  const fallback = whyThisGoal.trim();
  if (fallback.length > 0) {
    return [fallback, 'Tick off each checklist item when you complete it today.'];
  }
  throw new Error('Routine response missing overviewTips');
}

function parseDailyActions(raw: unknown, obj?: Record<string, unknown>): RoutineDailyAction[] {
  const list = Array.isArray(raw)
    ? raw
    : obj && Array.isArray(obj.steps)
      ? obj.steps
      : null;
  if (!list) throw new Error('Routine response missing dailyActions');

  const actions = list
    .filter(
      (item): item is Record<string, unknown> =>
        item != null && typeof item === 'object',
    )
    .map((item) => {
      const title = String(item.title ?? '').trim();
      const doneWhen = String(item.doneWhen ?? item.description ?? '').trim();
      const timeHint = String(item.timeHint ?? '').trim();
      return { title, doneWhen, timeHint };
    })
    .filter((item) => item.title && item.doneWhen && item.timeHint);

  return assertDailyActions(actions);
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

  const dailyActions = parseDailyActions(obj.dailyActions, obj);
  const tipLike = dailyActions.filter((a) => looksLikeRoutineTip(a.title));
  if (tipLike.length > 0) {
    throw new Error(`Routine dailyActions still contain tips: ${tipLike.map((a) => a.title).join('; ')}`);
  }

  const habit = habitCatalog.find((h) => h.id === primaryGoalId);
  return {
    id,
    primaryGoalId,
    primaryGoalTitle: habit?.title ?? primaryGoalId,
    whyThisGoal,
    intro,
    overviewTips: parseOverviewTips(obj.overviewTips, whyThisGoal),
    dailyActions,
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
