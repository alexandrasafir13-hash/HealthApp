import { habitCatalog } from '@/data/onboardingOptions';
import { buildRoutineGenerationContext, PlanGenerationContext } from '@/lib/buildRoutineContext';
import { buildFallbackAdaptivePlan } from '@/lib/fallbackPlan';
import {
  getHealthInsightsProxyUrl,
  getOpenAiApiKey,
  HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
  HEALTH_INSIGHTS_MODEL,
  HEALTH_INSIGHTS_TEMPERATURE,
  isHealthInsightsConfigured,
} from '@/lib/healthInsightsConfig';
import { normalizeDailyCheckInQuestion } from '@/lib/checkInQuestion';
import { parseModelJson } from '@/lib/parseModelJson';
import { UserProfile } from '@/types/onboarding';
import {
  AdaptivePlan,
  AdjustmentAction,
  AdjustmentCondition,
  AdjustmentRule,
  DailyCheckInQuestion,
  PLAN_WEEK_COUNT,
  PlanGenerationResult,
  PlanWeek,
  PrimaryMetric,
  WeekStatus,
} from '@/types/plan';

const PLAN_MAX_OUTPUT_TOKENS = Math.max(HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS, 4096);

const LLM_ANSWER_TYPES = ['number', 'scale_1_5', 'single_choice', 'time'] as const;

const ADJUSTMENT_CONDITIONS: AdjustmentCondition[] = ['avg_below', 'avg_above', 'skipped_days_gte'];

const ADJUSTMENT_ACTIONS: AdjustmentAction[] = [
  'reduce_duration',
  'shift_cue',
  'simplify_action',
  'increase_duration',
  'add_reminder',
];

const METRIC_VALUE_SCHEMA = {
  anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }],
};

const METRIC_SCHEMA = {
  type: 'object',
  properties: {
    label: { type: 'string' },
    value: METRIC_VALUE_SCHEMA,
    unit: { type: ['string', 'null'] },
  },
  required: ['label', 'value', 'unit'],
  additionalProperties: false,
};

const DAILY_CHECKIN_QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    label: { type: 'string' },
    type: { type: 'string', enum: LLM_ANSWER_TYPES },
    unit: { type: ['string', 'null'] },
    options: {
      anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
    },
  },
  required: ['id', 'label', 'type', 'unit', 'options'],
  additionalProperties: false,
};

const WEEK_ONE_SCHEMA = {
  type: 'object',
  properties: {
    week: { type: 'number' },
    status: { type: 'string', enum: ['active'] },
    focus: { type: 'string' },
    weeklyTarget: { type: 'string' },
    whyThisWeek: { type: 'string' },
    planSteps: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3,
    },
    dailyCheckInQuestions: {
      type: 'array',
      items: DAILY_CHECKIN_QUESTION_SCHEMA,
      minItems: 4,
      maxItems: 4,
    },
    reviewSignals: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 3,
    },
  },
  required: [
    'week',
    'status',
    'focus',
    'weeklyTarget',
    'whyThisWeek',
    'planSteps',
    'dailyCheckInQuestions',
    'reviewSignals',
  ],
  additionalProperties: false,
};

const WEEK_PROVISIONAL_SCHEMA = {
  type: 'object',
  properties: {
    week: { type: 'number' },
    status: { type: 'string', enum: ['provisional'] },
    focus: { type: 'string' },
    likelyTarget: { type: 'string' },
    preview: { type: 'string' },
    dependsOn: { type: 'string' },
  },
  required: ['week', 'status', 'focus', 'likelyTarget', 'preview', 'dependsOn'],
  additionalProperties: false,
};

const ADAPTATION_RULE_SCHEMA = {
  type: 'object',
  properties: {
    signal_id: { type: 'string' },
    condition: { type: 'string', enum: ADJUSTMENT_CONDITIONS },
    threshold: { type: 'number' },
    adjustment: { type: 'string', enum: ADJUSTMENT_ACTIONS },
    instruction: { type: 'string' },
  },
  required: ['signal_id', 'condition', 'threshold', 'adjustment', 'instruction'],
  additionalProperties: false,
};

const PLAN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    plan: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        goalId: { type: 'string' },
        goalName: { type: 'string' },
        goalSummary: { type: 'string' },
        baseline: METRIC_SCHEMA,
        target: METRIC_SCHEMA,
        weeks: {
          type: 'array',
          items: { anyOf: [WEEK_ONE_SCHEMA, WEEK_PROVISIONAL_SCHEMA] },
          minItems: PLAN_WEEK_COUNT,
          maxItems: PLAN_WEEK_COUNT,
        },
        adaptationRules: {
          type: 'array',
          items: ADAPTATION_RULE_SCHEMA,
          minItems: 3,
          maxItems: 3,
        },
      },
      required: [
        'id',
        'goalId',
        'goalName',
        'goalSummary',
        'baseline',
        'target',
        'weeks',
        'adaptationRules',
      ],
      additionalProperties: false,
    },
  },
  required: ['plan'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a habit plan generator for a wellness app.
Your only job is to fill a fixed 4-week plan schema with user-specific content.
You do not invent frameworks. You do not give wellness advice. You fill the template.

---

FRAMEWORK (immutable — never change this structure):

Week 1 — Understand: observation only, no behavior change yet.
  The user watches their current pattern. Nothing is asked of them except noticing.
  planSteps describe what to OBSERVE, not what to DO differently.

Week 2 — Start small: minimum viable version of the target behavior, once per day.
  Anchored to an existing routine from context_anchors.
  Duration: 2–5 minutes maximum. No exceptions.

Week 3 — Build consistency: same behavior, protect the streak.
  Add one obstacle plan. Focus is "never miss twice", not performance.

Week 4 — Test automaticity: reduce reliance on reminders.
  Did the cue start firing without the app prompt? That's the signal.

---

PLAN STEPS FORMAT (Week 1 only, exactly 3 steps):
Each step must follow: "[existing trigger from their life] → [specific observation action] → [takes X seconds/minutes]"
Example: "After you sit down for dinner → notice what you reach for first → takes 10 seconds"
No motivational language. No "try to" or "remember to". Concrete trigger + action + duration only.

CHECK-IN QUESTION TYPE RULES:
- Did they complete a specific behavior → single_choice, options: ["Yes", "Partially", "No"]
- Subjective effort, mood, or difficulty → scale_1_5
- A countable quantity (minutes, glasses, hours) → number + unit
- A time of day → time
- Never use short_text — it cannot be aggregated

ADAPTATION RULES FORMAT (exactly 3):
Each rule must reference a real check-in question id, a measurable condition, and a named adjustment.
{
  "signal_id": "<id from dailyCheckInQuestions>",
  "condition": "avg_below" | "avg_above" | "skipped_days_gte",
  "threshold": number,
  "adjustment": "reduce_duration" | "shift_cue" | "simplify_action" | "increase_duration" | "add_reminder",
  "instruction": string  // max 80 chars, plain English, what to change in week 2
}

WEEKS 2–4 PREVIEW TONE:
Write as honest prediction, not prescription. "You'll likely..." not "You will...".
dependsOn must name a specific reviewSignal from Week 1, not a generic statement.

---

SAFETY (hard constraints, never violate):
- No mention of weight, BMI, calories, body size, or appearance
- No fasting, restriction, or "eat less" framing
- No supplement or medication suggestions
- No intense exercise — if movement is the goal, start with walking or stretching only
- Adapt around every item in medical_flags — if unsure, make the plan gentler
- If constraints include time scarcity, Week 1 steps must be under 2 minutes each

---

OUTPUT: JSON only. No prose. No markdown. No explanation.

SCHEMA:
{
  "plan": {
    "id": "plan-1",
    "goalId": string,
    "goalName": string,
    "goalSummary": string,              // max 120 chars — what changes and why it matters to this user
    "baseline": {
      "label": string,
      "value": number | string | null,
      "unit": string | null
    },
    "target": {
      "label": string,
      "value": number | string | null,
      "unit": string | null
    },
    "weeks": [
      {
        "week": 1,
        "status": "active",
        "focus": string,                // max 60 chars
        "weeklyTarget": string,         // max 90 chars — what success looks like this week
        "whyThisWeek": string,          // max 120 chars — why observation before action
        "planSteps": string[],          // exactly 3, trigger→action→duration format
        "dailyCheckInQuestions": [
          {
            "id": string,
            "label": string,            // max 70 chars
            "type": "number" | "scale_1_5" | "single_choice" | "time",
            "unit": string | null,
            "options": string[] | null  // only for single_choice
          }
        ],                              // exactly 4 questions
        "reviewSignals": string[]       // max 3, each is a named observable signal
      },
      {
        "week": 2,
        "status": "provisional",
        "focus": string,
        "likelyTarget": string,
        "preview": string,              // max 120 chars, honest prediction
        "dependsOn": string             // max 100 chars, must name a Week 1 reviewSignal
      },
      {
        "week": 3,
        "status": "provisional",
        "focus": string,
        "likelyTarget": string,
        "preview": string,
        "dependsOn": string
      },
      {
        "week": 4,
        "status": "provisional",
        "focus": string,
        "likelyTarget": string,
        "preview": string,
        "dependsOn": string
      }
    ],
    "adaptationRules": [
      {
        "signal_id": string,
        "condition": "avg_below" | "avg_above" | "skipped_days_gte",
        "threshold": number,
        "adjustment": "reduce_duration" | "shift_cue" | "simplify_action" | "increase_duration" | "add_reminder",
        "instruction": string
      }
    ]                                   // exactly 3 rules
  }
}`;

function formatMetricSummary(
  prefix: string,
  raw: Record<string, unknown> | null | undefined,
): string {
  if (!raw) return '';
  const label = String(raw.label ?? '').trim();
  if (!label) return '';
  const valueRaw = raw.value;
  const valueText = valueRaw == null ? 'not set yet' : String(valueRaw);
  const unit = raw.unit == null ? null : String(raw.unit).trim() || null;
  return `${prefix}: ${label} — ${valueText}${unit ? ` ${unit}` : ''}`;
}

function parsePrimaryMetric(raw: unknown): PrimaryMetric {
  if (!raw || typeof raw !== 'object') throw new Error('Plan missing baseline');
  const obj = raw as Record<string, unknown>;
  const label = String(obj.label ?? '').trim();
  if (!label) throw new Error('Plan missing baseline.label');
  const unitRaw = obj.unit;
  const unit = unitRaw == null ? null : String(unitRaw).trim() || null;
  const baselineRaw = obj.baselineValue ?? obj.value;
  const baselineValue =
    baselineRaw == null
      ? null
      : typeof baselineRaw === 'number' || typeof baselineRaw === 'string'
        ? baselineRaw
        : null;
  return { label, unit, baselineValue };
}

function parsePlanSummaries(planRaw: Record<string, unknown>): {
  baselineSummary: string;
  desiredOutcome: string;
  primaryMetric: PrimaryMetric;
} {
  const baselineRaw = planRaw.baseline as Record<string, unknown> | undefined;
  const targetRaw = planRaw.target as Record<string, unknown> | undefined;

  const baselineSummary =
    String(planRaw.baselineSummary ?? '').trim() ||
    formatMetricSummary('Baseline', baselineRaw) ||
    String((planRaw.startingPoint as { summary?: string } | undefined)?.summary ?? '').trim();

  const desiredOutcome =
    String(planRaw.desiredOutcome ?? '').trim() || formatMetricSummary('Target', targetRaw);

  const primaryMetric = planRaw.primaryMetric
    ? parsePrimaryMetric(planRaw.primaryMetric)
    : parsePrimaryMetric(baselineRaw);

  if (!baselineSummary || !desiredOutcome) {
    throw new Error('Plan missing baseline or target summary');
  }

  return { baselineSummary, desiredOutcome, primaryMetric };
}

function parseCheckInQuestion(raw: unknown): DailyCheckInQuestion | null {
  return normalizeDailyCheckInQuestion(raw);
}

function parseWeek(raw: unknown): PlanWeek | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const weekNumber = Number(obj.weekNumber ?? obj.week);
  const status = String(obj.status ?? '').trim() as WeekStatus;
  const focus = String(obj.focus ?? '').trim();
  const weeklyTarget = String(obj.weeklyTarget ?? obj.target ?? obj.likelyTarget ?? '').trim();
  const whyThisWeek = String(obj.whyThisWeek ?? '').trim() || null;
  const planSteps = Array.isArray(obj.planSteps)
    ? obj.planSteps
        .filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
        .slice(0, 3)
    : [];
  const preview = String(obj.planForTheWeek ?? obj.weeklyStrategy ?? obj.preview ?? '').trim();
  const dependsOn = String(obj.dependsOn ?? '').trim();
  const mergedPreview = preview && dependsOn ? `${preview} ${dependsOn}` : preview || dependsOn;
  const planForTheWeek =
    planSteps.length > 0
      ? planSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')
      : whyThisWeek || mergedPreview;

  if (
    !Number.isFinite(weekNumber) ||
    (status !== 'active' && status !== 'provisional') ||
    !focus ||
    !weeklyTarget ||
    !planForTheWeek
  ) {
    return null;
  }

  const dailyCheckInQuestions = Array.isArray(obj.dailyCheckInQuestions)
    ? obj.dailyCheckInQuestions
        .map(parseCheckInQuestion)
        .filter((item): item is DailyCheckInQuestion => item != null)
    : [];

  const reviewRaw = obj.weeklyReviewSignals ?? obj.endOfWeekReviewSignals ?? obj.reviewSignals;
  const weeklyReviewSignals = Array.isArray(reviewRaw)
    ? reviewRaw
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    : [];

  if (weekNumber === 1) {
    if (status !== 'active') return null;
    if (planSteps.length !== 3 || dailyCheckInQuestions.length !== 4 || weeklyReviewSignals.length < 1) {
      return null;
    }
  }

  return {
    weekNumber,
    status,
    focus,
    weeklyTarget,
    whyThisWeek,
    planSteps,
    planForTheWeek,
    experiments: [],
    dailyCheckInQuestions: weekNumber === 1 ? dailyCheckInQuestions : [],
    weeklyReviewSignals: weekNumber === 1 ? weeklyReviewSignals : [],
  };
}

function parseAdjustmentRule(raw: unknown): AdjustmentRule | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const signalId = String(obj.signal_id ?? obj.signalId ?? obj.signal ?? obj.when ?? '').trim();
  const instruction = String(obj.instruction ?? obj.nextWeekAdjustment ?? obj.then ?? '').trim();
  const condition = String(obj.condition ?? '').trim() as AdjustmentCondition;
  const threshold = Number(obj.threshold);
  const adjustment = String(obj.adjustment ?? '').trim() as AdjustmentAction;

  if (signalId && instruction && ADJUSTMENT_CONDITIONS.includes(condition) && Number.isFinite(threshold) && ADJUSTMENT_ACTIONS.includes(adjustment)) {
    return { signalId, condition, threshold, adjustment, instruction };
  }

  if (signalId && instruction) {
    return {
      signalId,
      condition: 'avg_below',
      threshold: 3,
      adjustment: 'simplify_action',
      instruction: instruction.slice(0, 80),
    };
  }

  return null;
}

function normalizeAdaptivePlan(raw: unknown, profile: UserProfile): AdaptivePlan {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid plan response');
  const obj = raw as Record<string, unknown>;
  const planRaw = (obj.plan ?? obj) as Record<string, unknown>;

  const goalId = String(planRaw.goalId ?? '').trim();
  if (!profile.habitIds.includes(goalId)) {
    throw new Error('Plan picked an invalid goal');
  }

  const goalName = String(planRaw.goalName ?? '').trim();
  const goalSummary = String(planRaw.goalSummary ?? '').trim();
  const id = String(planRaw.id ?? 'plan-1').trim() || 'plan-1';

  if (!goalName || !goalSummary) {
    throw new Error('Plan missing summary fields');
  }

  const { baselineSummary, desiredOutcome, primaryMetric } = parsePlanSummaries(planRaw);

  const weeks = Array.isArray(planRaw.weeks)
    ? planRaw.weeks
        .map(parseWeek)
        .filter((item): item is PlanWeek => item != null)
        .sort((a, b) => a.weekNumber - b.weekNumber)
    : [];

  if (weeks.length !== PLAN_WEEK_COUNT) {
    throw new Error('Plan must include exactly 4 weeks');
  }

  const week1 = weeks.find((week) => week.weekNumber === 1);
  if (!week1 || week1.status !== 'active') {
    throw new Error('Week 1 must be active');
  }

  const rulesRaw = planRaw.adaptationRules ?? planRaw.adjustmentRules;
  const adjustmentRules = Array.isArray(rulesRaw)
    ? rulesRaw.map(parseAdjustmentRule).filter((item): item is AdjustmentRule => item != null)
    : [];

  if (adjustmentRules.length < 1) throw new Error('Plan missing adaptation rules');

  const habit = habitCatalog.find((h) => h.id === goalId);
  return {
    id,
    goalId,
    goalName: goalName || habit?.title || goalId,
    goalSummary,
    baselineSummary,
    desiredOutcome,
    primaryMetric,
    weeks,
    adjustmentRules,
  };
}

async function fetchViaProxy(
  context: PlanGenerationContext,
  profile: UserProfile,
): Promise<AdaptivePlan> {
  const url = getHealthInsightsProxyUrl();
  if (!url) throw new Error('Proxy URL not configured');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ context, kind: 'plan' }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Plan request failed (${res.status})`);
  }

  const data: unknown = await res.json();
  if (!data || typeof data !== 'object') throw new Error('Invalid plan response');
  return normalizeAdaptivePlan(data, profile);
}

async function fetchViaOpenAi(
  context: PlanGenerationContext,
  profile: UserProfile,
): Promise<AdaptivePlan> {
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
          content: JSON.stringify(context, null, 2),
        },
      ],
      temperature: HEALTH_INSIGHTS_TEMPERATURE,
      max_completion_tokens: PLAN_MAX_OUTPUT_TOKENS,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'adaptive_plan',
          strict: true,
          schema: PLAN_RESPONSE_SCHEMA,
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
    throw new Error('Plan response was cut off');
  }

  return normalizeAdaptivePlan(parseModelJson(text), profile);
}

export async function generateAdaptivePlan(profile: UserProfile): Promise<PlanGenerationResult> {
  const context = buildRoutineGenerationContext(profile);

  if (isHealthInsightsConfigured()) {
    try {
      if (getOpenAiApiKey()) {
        const plan = await fetchViaOpenAi(context, profile);
        return { plan, generatedAt: new Date().toISOString(), source: 'llm' };
      }
      if (getHealthInsightsProxyUrl()) {
        const plan = await fetchViaProxy(context, profile);
        return { plan, generatedAt: new Date().toISOString(), source: 'llm' };
      }
    } catch {
      // fall through to local template
    }
  }

  return buildFallbackAdaptivePlan(profile.habitIds, profile.goalDetails ?? {});
}

/** @deprecated Use generateAdaptivePlan */
export async function generateRoutineProposals(profile: UserProfile) {
  return generateAdaptivePlan(profile);
}
