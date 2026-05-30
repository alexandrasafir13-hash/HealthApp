import { habitCatalog } from '@/data/onboardingOptions';
import { buildRoutineGenerationContext, RoutineGenerationContext } from '@/lib/buildRoutineContext';
import { buildFallbackAdaptivePlan } from '@/lib/fallbackPlan';
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
  AdaptationRule,
  AdaptivePlan,
  CheckInAnswerType,
  DailyCheckInQuestion,
  PLAN_WEEK_COUNT,
  PlanGenerationResult,
  PlanMetric,
  PlanStartingPoint,
  PlanWeek,
  SuggestedExperiment,
  WeekStatus,
} from '@/types/plan';

const PLAN_MAX_OUTPUT_TOKENS = Math.max(HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS, 4096);

const ANSWER_TYPES: CheckInAnswerType[] = [
  'number',
  'scale_1_5',
  'single_choice',
  'multi_choice',
  'short_text',
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
    whyItMatters: { type: 'string' },
  },
  required: ['id', 'question', 'answerType', 'required', 'options', 'whyItMatters'],
  additionalProperties: false,
};

const SUGGESTED_EXPERIMENT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    whenToUse: { type: 'string' },
  },
  required: ['title', 'description', 'whenToUse'],
  additionalProperties: false,
};

const PLAN_WEEK_SCHEMA = {
  type: 'object',
  properties: {
    weekNumber: { type: 'number' },
    status: { type: 'string', enum: WEEK_STATUSES },
    focus: { type: 'string' },
    target: { type: 'string' },
    whyThisWeek: { type: 'string' },
    weeklyStrategy: { type: 'string' },
    suggestedExperiments: {
      type: 'array',
      items: SUGGESTED_EXPERIMENT_SCHEMA,
    },
    dailyCheckInQuestions: {
      type: 'array',
      items: DAILY_CHECKIN_QUESTION_SCHEMA,
      minItems: 2,
    },
    endOfWeekReviewSignals: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
  },
  required: [
    'weekNumber',
    'status',
    'focus',
    'target',
    'whyThisWeek',
    'weeklyStrategy',
    'suggestedExperiments',
    'dailyCheckInQuestions',
    'endOfWeekReviewSignals',
  ],
  additionalProperties: false,
};

const ADAPTATION_RULE_SCHEMA = {
  type: 'object',
  properties: {
    condition: { type: 'string' },
    adjustment: { type: 'string' },
  },
  required: ['condition', 'adjustment'],
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
        startingPoint: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            knownMetrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  value: METRIC_VALUE_SCHEMA,
                  unit: { type: ['string', 'null'] },
                },
                required: ['label', 'value', 'unit'],
                additionalProperties: false,
              },
            },
            assumptions: { type: 'array', items: { type: 'string' } },
          },
          required: ['summary', 'knownMetrics', 'assumptions'],
          additionalProperties: false,
        },
        desiredOutcome: { type: 'string' },
        planPrinciple: { type: 'string' },
        weeks: {
          type: 'array',
          items: PLAN_WEEK_SCHEMA,
          minItems: PLAN_WEEK_COUNT,
          maxItems: PLAN_WEEK_COUNT,
        },
        adaptationRules: {
          type: 'array',
          items: ADAPTATION_RULE_SCHEMA,
          minItems: 1,
        },
      },
      required: [
        'id',
        'goalId',
        'goalName',
        'goalSummary',
        'startingPoint',
        'desiredOutcome',
        'planPrinciple',
        'weeks',
        'adaptationRules',
      ],
      additionalProperties: false,
    },
  },
  required: ['plan'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a behavior-change coach creating adaptive 4-week plans for a wellness app.

The app does NOT use daily habit checkboxes.
The app uses daily check-ins to understand how the plan is going, then updates the next week based on the user's real inputs.

You receive JSON with:

* age
* sex
* weight
* height
* medicalConditions
* selectedGoalIds
* wantsToImprove
* baselineMetrics
* userPreferences
* constraints

Your job:
Create one 4-week adaptive plan for the user's selected goal.

The plan must:

* be practical
* be beginner-friendly
* progress week by week
* use small weekly increments
* include daily check-in questions
* collect enough information to update the plan at the end of each week
* avoid generic wellness advice
* avoid daily tickbox tasks

Important:
This is NOT a todo list.
This is NOT a checklist routine.
This is NOT a list of wellness tips.
This is a structured 4-week plan with daily reflection/check-in data.

The plan should answer:

* What is the user trying to change?
* What is the starting point?
* What is the target for Week 1?
* What should the user try this week?
* What should they report daily?
* How will the plan adapt at the end of the week?
* What is the provisional 4-week progression?

Plan structure:

* Week 1 should be specific and actionable.
* Weeks 2, 3, and 4 should be provisional because they may change after weekly reviews.
* Do not over-prescribe Weeks 2–4.
* Each week should build on the previous week.
* Weekly targets should be realistic, not aggressive.
* The plan should focus on consistency and learning first, then improvement.

Daily check-ins:
Daily check-ins are for collecting data, not ticking off tasks.

Each daily check-in question must collect useful information for adapting the plan.

Good daily check-in questions:

* "What was your screen time today?"
* "What got in the way today?"
* "What worked better than expected?"
* "How hard did the plan feel today?"
* "Which part of the plan felt unrealistic?"
* "Do you want tomorrow to be easier, the same, or slightly harder?"

Bad daily check-in questions:

* "Did you drink water?"
* "Did you stretch?"
* "Did you avoid screens?"
* "Did you complete your routine?"
* "Did you stay motivated?"
* "Did you have a good day?"

Avoid binary checkbox-style questions unless they are useful for plan adaptation.

For each week, include:

* weekNumber
* status: "active" for Week 1, "provisional" for Weeks 2–4
* focus
* target
* whyThisWeek
* weeklyStrategy
* suggestedExperiments
* dailyCheckInQuestions
* endOfWeekReviewSignals

suggestedExperiments:
These are possible things the user can try during the week.
They are NOT mandatory daily tasks.
They should be framed as experiments, not orders.

endOfWeekReviewSignals:
List what the app should look at when updating the next week, such as:

* average metric change
* difficulty trend
* repeated blockers
* what worked
* what felt unrealistic
* user confidence
* skipped days
* user preference for easier/same/harder

Safety rules:

* This is general wellness support.
* Do not diagnose.
* Do not mention medication.
* Do not suggest supplements.
* Do not suggest fasting or calorie restriction.
* Do not suggest intense exercise.
* Do not calculate BMI.
* Do not comment on body size.
* Be careful with medicalConditions.
* If medicalConditions suggest pregnancy, heart disease, diabetes, eating disorder, severe pain, mobility limits, recent surgery, or any serious/chronic condition, keep the plan gentle and suggest professional guidance where relevant.

Tone:

* plain language
* practical
* supportive without being cheesy
* no motivational clichés
* no shame
* no scare tactics
* no clinical language unless needed

Return JSON only.
No markdown.
No comments.
No extra text.

Output schema:
{
"plan": {
"id": "plan-1",
"goalId": string,
"goalName": string,
"goalSummary": string,
"startingPoint": {
"summary": string,
"knownMetrics": [
{
"label": string,
"value": number | string | null,
"unit": string | null
}
],
"assumptions": string[]
},
"desiredOutcome": string,
"planPrinciple": string,
"weeks": [
{
"weekNumber": number,
"status": "active" | "provisional",
"focus": string,
"target": string,
"whyThisWeek": string,
"weeklyStrategy": string,
"suggestedExperiments": [
{
"title": string,
"description": string,
"whenToUse": string
}
],
"dailyCheckInQuestions": [
{
"id": string,
"question": string,
"answerType": "number" | "scale_1_5" | "single_choice" | "multi_choice" | "short_text",
"required": boolean,
"options": string[] | null,
"whyItMatters": string
}
],
"endOfWeekReviewSignals": string[]
}
],
"adaptationRules": [
{
"condition": string,
"adjustment": string
}
]
}
}`;

function parseMetric(raw: unknown): PlanMetric | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const label = String(obj.label ?? '').trim();
  if (!label) return null;
  const valueRaw = obj.value;
  const value =
    valueRaw == null
      ? null
      : typeof valueRaw === 'number' || typeof valueRaw === 'string'
        ? valueRaw
        : null;
  const unitRaw = obj.unit;
  const unit = unitRaw == null ? null : String(unitRaw).trim() || null;
  return { label, value, unit };
}

function parseStartingPoint(raw: unknown): PlanStartingPoint {
  if (!raw || typeof raw !== 'object') throw new Error('Plan missing startingPoint');
  const obj = raw as Record<string, unknown>;
  const summary = String(obj.summary ?? '').trim();
  if (!summary) throw new Error('Plan missing startingPoint.summary');
  const knownMetrics = Array.isArray(obj.knownMetrics)
    ? obj.knownMetrics.map(parseMetric).filter((item): item is PlanMetric => item != null)
    : [];
  const assumptions = Array.isArray(obj.assumptions)
    ? obj.assumptions
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    : [];
  return { summary, knownMetrics, assumptions };
}

function parseExperiment(raw: unknown): SuggestedExperiment | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const title = String(obj.title ?? '').trim();
  const description = String(obj.description ?? '').trim();
  const whenToUse = String(obj.whenToUse ?? '').trim();
  if (!title || !description || !whenToUse) return null;
  return { title, description, whenToUse };
}

function parseCheckInQuestion(raw: unknown): DailyCheckInQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = String(obj.id ?? '').trim();
  const question = String(obj.question ?? '').trim();
  const answerType = String(obj.answerType ?? '').trim() as CheckInAnswerType;
  const whyItMatters = String(obj.whyItMatters ?? '').trim();
  if (!id || !question || !whyItMatters || !ANSWER_TYPES.includes(answerType)) return null;
  const options = Array.isArray(obj.options)
    ? obj.options.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : null;
  return {
    id,
    question,
    answerType,
    required: obj.required === true,
    options: options && options.length > 0 ? options : null,
    whyItMatters,
  };
}

function parseWeek(raw: unknown): PlanWeek | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const weekNumber = Number(obj.weekNumber);
  const status = String(obj.status ?? '').trim() as WeekStatus;
  const focus = String(obj.focus ?? '').trim();
  const target = String(obj.target ?? '').trim();
  const whyThisWeek = String(obj.whyThisWeek ?? '').trim();
  const weeklyStrategy = String(obj.weeklyStrategy ?? '').trim();
  if (
    !Number.isFinite(weekNumber) ||
    !WEEK_STATUSES.includes(status) ||
    !focus ||
    !target ||
    !whyThisWeek ||
    !weeklyStrategy
  ) {
    return null;
  }

  const suggestedExperiments = Array.isArray(obj.suggestedExperiments)
    ? obj.suggestedExperiments
        .map(parseExperiment)
        .filter((item): item is SuggestedExperiment => item != null)
    : [];
  const dailyCheckInQuestions = Array.isArray(obj.dailyCheckInQuestions)
    ? obj.dailyCheckInQuestions
        .map(parseCheckInQuestion)
        .filter((item): item is DailyCheckInQuestion => item != null)
    : [];
  const endOfWeekReviewSignals = Array.isArray(obj.endOfWeekReviewSignals)
    ? obj.endOfWeekReviewSignals
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    : [];

  if (dailyCheckInQuestions.length < 2 || endOfWeekReviewSignals.length < 1) return null;

  return {
    weekNumber,
    status,
    focus,
    target,
    whyThisWeek,
    weeklyStrategy,
    suggestedExperiments,
    dailyCheckInQuestions,
    endOfWeekReviewSignals,
  };
}

function parseAdaptationRule(raw: unknown): AdaptationRule | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const condition = String(obj.condition ?? '').trim();
  const adjustment = String(obj.adjustment ?? '').trim();
  if (!condition || !adjustment) return null;
  return { condition, adjustment };
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
  const desiredOutcome = String(planRaw.desiredOutcome ?? '').trim();
  const planPrinciple = String(planRaw.planPrinciple ?? '').trim();
  const id = String(planRaw.id ?? 'plan-1').trim() || 'plan-1';

  if (!goalName || !goalSummary || !desiredOutcome || !planPrinciple) {
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

  const adaptationRules = Array.isArray(planRaw.adaptationRules)
    ? planRaw.adaptationRules
        .map(parseAdaptationRule)
        .filter((item): item is AdaptationRule => item != null)
    : [];

  if (adaptationRules.length < 1) throw new Error('Plan missing adaptation rules');

  const habit = habitCatalog.find((h) => h.id === goalId);
  return {
    id,
    goalId,
    goalName: goalName || habit?.title || goalId,
    goalSummary,
    startingPoint: parseStartingPoint(planRaw.startingPoint),
    desiredOutcome,
    planPrinciple,
    weeks,
    adaptationRules,
  };
}

async function fetchViaProxy(
  context: RoutineGenerationContext,
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
  const payload = (data as Record<string, unknown>).plan != null ? data : data;
  return normalizeAdaptivePlan(payload, profile);
}

async function fetchViaOpenAi(
  context: RoutineGenerationContext,
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
          content: `User onboarding data (JSON):\n${JSON.stringify(context, null, 2)}`,
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
  const result = await generateAdaptivePlan(profile);
  return result;
}
