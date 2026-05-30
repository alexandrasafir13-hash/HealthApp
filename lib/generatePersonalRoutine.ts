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
  AdjustmentRule,
  CheckInAnswerType,
  DailyCheckInQuestion,
  PLAN_WEEK_COUNT,
  PlanExperiment,
  PlanGenerationResult,
  PlanWeek,
  PrimaryMetric,
  WeekStatus,
} from '@/types/plan';

const PLAN_MAX_OUTPUT_TOKENS = Math.max(HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS, 4096);

const ANSWER_TYPES: CheckInAnswerType[] = [
  'number',
  'scale_1_5',
  'single_choice',
  'multi_choice',
  'short_text',
  'time',
];

const WEEK_STATUSES: WeekStatus[] = ['active', 'provisional'];

const METRIC_VALUE_SCHEMA = {
  anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }],
};

const DAILY_CHECKIN_QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    question: { type: 'string' },
    answerType: { type: 'string', enum: ANSWER_TYPES },
    required: { type: 'boolean' },
    options: {
      anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
    },
    unit: { type: ['string', 'null'] },
  },
  required: ['id', 'question', 'answerType', 'required', 'options', 'unit'],
  additionalProperties: false,
};

const EXPERIMENT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    whatItTests: { type: 'string' },
  },
  required: ['title', 'description', 'whatItTests'],
  additionalProperties: false,
};

const PLAN_WEEK_SCHEMA = {
  type: 'object',
  properties: {
    weekNumber: { type: 'number' },
    status: { type: 'string', enum: WEEK_STATUSES },
    focus: { type: 'string' },
    weeklyTarget: { type: 'string' },
    planForTheWeek: { type: 'string' },
    experiments: {
      type: 'array',
      items: EXPERIMENT_SCHEMA,
    },
    dailyCheckInQuestions: {
      type: 'array',
      items: DAILY_CHECKIN_QUESTION_SCHEMA,
      minItems: 3,
      maxItems: 5,
    },
    weeklyReviewSignals: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
  },
  required: [
    'weekNumber',
    'status',
    'focus',
    'weeklyTarget',
    'planForTheWeek',
    'experiments',
    'dailyCheckInQuestions',
    'weeklyReviewSignals',
  ],
  additionalProperties: false,
};

const ADJUSTMENT_RULE_SCHEMA = {
  type: 'object',
  properties: {
    signal: { type: 'string' },
    nextWeekAdjustment: { type: 'string' },
  },
  required: ['signal', 'nextWeekAdjustment'],
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
        baselineSummary: { type: 'string' },
        desiredOutcome: { type: 'string' },
        primaryMetric: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            unit: { type: ['string', 'null'] },
            baselineValue: METRIC_VALUE_SCHEMA,
          },
          required: ['label', 'unit', 'baselineValue'],
          additionalProperties: false,
        },
        weeks: {
          type: 'array',
          items: PLAN_WEEK_SCHEMA,
          minItems: PLAN_WEEK_COUNT,
          maxItems: PLAN_WEEK_COUNT,
        },
        adjustmentRules: {
          type: 'array',
          items: ADJUSTMENT_RULE_SCHEMA,
          minItems: 1,
        },
      },
      required: [
        'id',
        'goalId',
        'goalName',
        'goalSummary',
        'baselineSummary',
        'desiredOutcome',
        'primaryMetric',
        'weeks',
        'adjustmentRules',
      ],
      additionalProperties: false,
    },
  },
  required: ['plan'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You create compact adaptive 4-week plans for a wellness app.

The user wants to see the full 4-week plan upfront.
Week 1 must be detailed because it starts now.
Weeks 2-4 must be shorter previews because they will adapt after each weekly review.

Input JSON includes:

* selectedGoal
* baselineMetrics
* desiredOutcome
* constraints
* medicalConditions
* onboardingAnswers

Create ONE 4-week plan.

Rules:

* Return JSON only.
* No essays.
* No generic wellness advice.
* No daily habit checkboxes.
* No daily todo lists.
* The plan must show Week 1, Week 2, Week 3, and Week 4.
* Week 1 is active and detailed.
* Weeks 2-4 are provisional and compact.
* Daily check-ins are only generated for Week 1.
* Weeks 2-4 should explain what will likely happen, not pretend the future is fixed.
* Each week should feel like one step in a progression.

Week 1 must include:

* focus
* weeklyTarget
* whyThisWeek
* planSteps
* dailyCheckInQuestions
* reviewSignals

Weeks 2-4 must include:

* focus
* likelyTarget
* preview
* dependsOn

Hard limits:

* goalSummary: max 120 characters
* week focus: max 60 characters
* Week 1 weeklyTarget: max 90 characters
* Week 1 whyThisWeek: max 120 characters
* Week 1 planSteps: exactly 3, max 70 characters each
* Week 1 check-in questions: exactly 4, max 70 characters each
* Week 1 reviewSignals: max 3
* Weeks 2-4 preview: max 120 characters each
* Weeks 2-4 dependsOn: max 100 characters each

Safety:
Keep plans gentle. Do not diagnose, mention medication, suggest supplements, fasting, calorie restriction, intense exercise, BMI, or body-size comments. Adapt around medicalConditions and constraints.

Output schema:
{
"plan": {
"id": "plan-1",
"goalId": string,
"goalName": string,
"goalSummary": string,
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
"focus": string,
"weeklyTarget": string,
"whyThisWeek": string,
"planSteps": string[],
"dailyCheckInQuestions": [
{
"id": string,
"label": string,
"type": "number" | "scale_1_5" | "single_choice" | "short_text" | "time",
"unit": string | null,
"options": string[] | null
}
],
"reviewSignals": string[]
},
{
"week": 2,
"status": "provisional",
"focus": string,
"likelyTarget": string,
"preview": string,
"dependsOn": string
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
"when": string,
"then": string
}
]
}
}`;



function parsePrimaryMetric(raw: unknown): PrimaryMetric {
  if (!raw || typeof raw !== 'object') throw new Error('Plan missing primaryMetric');
  const obj = raw as Record<string, unknown>;
  const label = String(obj.label ?? '').trim();
  if (!label) throw new Error('Plan missing primaryMetric.label');
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

function parseExperiment(raw: unknown): PlanExperiment | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const title = String(obj.title ?? '').trim();
  const description = String(obj.description ?? '').trim();
  const whatItTests = String(obj.whatItTests ?? obj.whenToUse ?? '').trim();
  if (!title || !description || !whatItTests) return null;
  return { title, description, whatItTests };
}

function parseCheckInQuestion(raw: unknown): DailyCheckInQuestion | null {
  return normalizeDailyCheckInQuestion(raw);
}

function parseWeek(raw: unknown): PlanWeek | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const weekNumber = Number(obj.weekNumber);
  const status = String(obj.status ?? '').trim() as WeekStatus;
  const focus = String(obj.focus ?? '').trim();
  const weeklyTarget = String(obj.weeklyTarget ?? obj.target ?? '').trim();
  const planForTheWeek = String(obj.planForTheWeek ?? obj.weeklyStrategy ?? obj.whyThisWeek ?? '').trim();
  if (
    !Number.isFinite(weekNumber) ||
    !WEEK_STATUSES.includes(status) ||
    !focus ||
    !weeklyTarget ||
    !planForTheWeek
  ) {
    return null;
  }

  const experimentsRaw = obj.experiments ?? obj.suggestedExperiments;
  const experiments = Array.isArray(experimentsRaw)
    ? experimentsRaw.map(parseExperiment).filter((item): item is PlanExperiment => item != null)
    : [];

  const dailyCheckInQuestions = Array.isArray(obj.dailyCheckInQuestions)
    ? obj.dailyCheckInQuestions
        .map(parseCheckInQuestion)
        .filter((item): item is DailyCheckInQuestion => item != null)
    : [];

  const reviewRaw = obj.weeklyReviewSignals ?? obj.endOfWeekReviewSignals;
  const weeklyReviewSignals = Array.isArray(reviewRaw)
    ? reviewRaw
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    : [];

  if (dailyCheckInQuestions.length < 3 || weeklyReviewSignals.length < 1) return null;

  return {
    weekNumber,
    status,
    focus,
    weeklyTarget,
    planForTheWeek,
    experiments,
    dailyCheckInQuestions,
    weeklyReviewSignals,
  };
}

function parseAdjustmentRule(raw: unknown): AdjustmentRule | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const signal = String(obj.signal ?? obj.condition ?? '').trim();
  const nextWeekAdjustment = String(obj.nextWeekAdjustment ?? obj.adjustment ?? '').trim();
  if (!signal || !nextWeekAdjustment) return null;
  return { signal, nextWeekAdjustment };
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
  const baselineSummary = String(
    planRaw.baselineSummary ?? (planRaw.startingPoint as { summary?: string } | undefined)?.summary ?? '',
  ).trim();
  const desiredOutcome = String(planRaw.desiredOutcome ?? '').trim();
  const id = String(planRaw.id ?? 'plan-1').trim() || 'plan-1';

  if (!goalName || !goalSummary || !baselineSummary || !desiredOutcome) {
    throw new Error('Plan missing summary fields');
  }

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

  const rulesRaw = planRaw.adjustmentRules ?? planRaw.adaptationRules;
  const adjustmentRules = Array.isArray(rulesRaw)
    ? rulesRaw.map(parseAdjustmentRule).filter((item): item is AdjustmentRule => item != null)
    : [];

  if (adjustmentRules.length < 1) throw new Error('Plan missing adjustment rules');

  const habit = habitCatalog.find((h) => h.id === goalId);
  return {
    id,
    goalId,
    goalName: goalName || habit?.title || goalId,
    goalSummary,
    baselineSummary,
    desiredOutcome,
    primaryMetric: parsePrimaryMetric(planRaw.primaryMetric),
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
