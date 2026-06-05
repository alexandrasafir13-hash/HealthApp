import { buildRoutineGenerationContext, PlanGenerationContext } from '@/lib/buildRoutineContext';

import {
  getHealthInsightsProxyUrl,
  getOpenAiApiKey,
  HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS,
  TASK_MODEL,
  TASK_REASONING_EFFORT,
  HEALTH_INSIGHTS_TEMPERATURE
} from '@/lib/healthInsightsConfig';
import { parseModelJson } from '@/lib/parseModelJson';
import { UserProfile } from '@/types/onboarding';
import {
  AdaptivePlan,
  CheckInAnswerType,
  DailyCheckInQuestion,
  NewAdaptationRule,
  PlanAction,
  PlanGenerationResult,
  PlanPhase,
  PlanReviewRule,
  PlanSignal,
  PlanWeek,
  PrimaryOutcome,
} from '@/types/plan';

const PLAN_MAX_OUTPUT_TOKENS = Math.max(HEALTH_INSIGHTS_MAX_OUTPUT_TOKENS, 4096);

const PLAN_ACTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    label: { type: 'string' },
    trigger: { type: ['string', 'null'] },
    action: { type: 'string' },
    duration: { type: ['string', 'null'] },
    required: { type: 'boolean' },
  },
  required: ['id', 'label', 'trigger', 'action', 'duration', 'required'],
  additionalProperties: false,
};

const PLAN_SIGNAL_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    label: { type: 'string' },
    computedFromQuestionId: { type: 'string' },
    direction: { type: 'string', enum: ['higher_is_better', 'lower_is_better', 'stable_is_better'] },
  },
  required: ['id', 'label', 'computedFromQuestionId', 'direction'],
  additionalProperties: false,
};

const PLAN_REVIEW_RULE_SCHEMA = {
  type: 'object',
  properties: {
    reviewAfterDays: { type: 'number' },
    progressLooksGoodWhen: { type: 'string' },
    progressLooksMixedWhen: { type: 'string' },
    progressLooksPoorWhen: { type: 'string' },
  },
  required: ['reviewAfterDays', 'progressLooksGoodWhen', 'progressLooksMixedWhen', 'progressLooksPoorWhen'],
  additionalProperties: false,
};

const PLAN_CHECKIN_QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    label: { type: 'string' },
    type: { type: 'string', enum: ['number', 'scale_1_5', 'single_choice', 'time', 'boolean'] },
    unit: { type: ['string', 'null'] },
    options: {
      anyOf: [
        { type: 'array', items: { type: 'string' } },
        { type: 'null' }
      ]
    },
  },
  required: ['id', 'label', 'type', 'unit', 'options'],
  additionalProperties: false,
};

const PLAN_PHASE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    purpose: { type: 'string' },
    durationDays: { type: 'number' },
    entryCondition: { type: 'string' },
    exitCondition: { type: 'string' },
    dailyUserWork: { type: 'string' },
    actions: {
      type: 'array',
      items: PLAN_ACTION_SCHEMA,
    },
    checkInQuestions: {
      type: 'array',
      items: PLAN_CHECKIN_QUESTION_SCHEMA,
    },
    signals: {
      type: 'array',
      items: PLAN_SIGNAL_SCHEMA,
    },
    reviewRule: PLAN_REVIEW_RULE_SCHEMA,
  },
  required: [
    'id',
    'title',
    'purpose',
    'durationDays',
    'entryCondition',
    'exitCondition',
    'dailyUserWork',
    'actions',
    'checkInQuestions',
    'signals',
    'reviewRule',
  ],
  additionalProperties: false,
};

const NEW_ADAPTATION_RULE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    signalId: { type: 'string' },
    condition: {
      type: 'string',
      enum: ['avg_below', 'avg_above', 'completion_below', 'skipped_days_gte', 'value_stable'],
    },
    threshold: { type: 'number' },
    action: {
      type: 'string',
      enum: ['continue', 'simplify', 'reduce', 'increase', 'change_trigger', 'add_support', 'repeat_phase'],
    },
    instruction: { type: 'string' },
  },
  required: ['id', 'signalId', 'condition', 'threshold', 'action', 'instruction'],
  additionalProperties: false,
};

const PLAN_PRIMARY_OUTCOME_SCHEMA = {
  type: 'object',
  properties: {
    label: { type: 'string' },
    currentValue: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
    desiredValue: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
    unit: { type: ['string', 'null'] },
  },
  required: ['label', 'currentValue', 'desiredValue', 'unit'],
  additionalProperties: false,
};

const PLAN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    plan: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        goalName: { type: 'string' },
        goalSummary: { type: 'string' },
        reasoningSummary: { type: 'string' },
        horizonDays: { type: 'number' },
        primaryOutcome: PLAN_PRIMARY_OUTCOME_SCHEMA,
        phases: {
          type: 'array',
          items: PLAN_PHASE_SCHEMA,
        },
        adaptationRules: {
          type: 'array',
          items: NEW_ADAPTATION_RULE_SCHEMA,
        },
        safetyNotes: {
          type: 'array',
          items: { type: 'string' },
        },
        insights: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: [
        'id',
        'goalName',
        'goalSummary',
        'reasoningSummary',
        'horizonDays',
        'primaryOutcome',
        'phases',
        'adaptationRules',
        'safetyNotes',
        'insights',
      ],
      additionalProperties: false,
    },
  },
  required: ['plan'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a personal OKR designer for a health and lifestyle app.
Your job is to turn the user's onboarding answers and user story into a practical path.
Write user-facing text in the same language the user used in their request and profile context. If the language is unclear, use English.

The user story is the source of truth.

Create:
* several Insights based on the onboarding data
* one clear Objective
* 2 to 4 measurable Key Results
* a phased path
* concrete actions
* structured check-ins
* measurable review rules

Use OKR and product-planning logic internally only.
Do NOT mention OKRs, agile, scrum, sprints, epics, stories, initiatives, backlogs, or tasks in user-facing text.
DO NOT exceed 45 days maximum for the path.
DO NOT exceed 10 days maximum for each phase.
THIS IS NOT A HABBIT BUILDER. DON'T TURN THIS INTO ONE.

Think in this order:
1. Understand the user story: context, problem, outcome.
2. Define the Objective.
3. Define concrete Key Results.
5. Split the path into useful phases.
6. Add actions, check-ins, signals, and review rules.

Key Results must come from the user story.
They should measure concrete progress, such as but not limited to:
* action completion
* frequency
* duration
* consistency
* blocker frequency
* difficulty
* follow-through

DO NOT use generic health signals unless they fit the stated goal.
e.g. DO NOT track cravings for a reading goal or sleep for a hydration goal unless the user story makes that relevant.

Actions rule:
Actions MUST follow a logical, historical, or schedule pattern.
Actions MUST NOT be randomly placed.

Biometrics rule:
Use biometrics when provided to calibrate safety, difficulty, pacing, realism, and accessibility.
Do not mention biometrics in user-facing text unless extremely needed for safety or clarity.
Do not calculate or mention BMI.

Safety rules:
Do not suggest fasting, severe restriction, supplements, medication, intense exercise, extreme targets, or punishment-based actions.
Do not diagnose or make clinical/medical claims.
Respect physical concerns, time limits, emotional constraints, accessibility constraints, food constraints, and movement constraints.
If the goal is risky, make the path conservative and add a neutral safety note.
Use biometrics internally, but focus the path on safe behaviors, consistency, manageable effort, and feeling more in control.

Writing rules:
* Use simple language.
* Use “you” and “your”.
* Never write “the user” in prose fields.
* Avoid motivational filler.
* Avoid vague advice.
* Avoid clinical/medical language.
* Keep “reasoningSummary” to one sentence.

Primary outcome:
Choose the clearest measurable Key Result.
It must be relevant to the user story.
Prefer behavior-based outcomes over body-related outcomes.

Actions:
Each action must say what to do, when to do it, how long it takes if relevant, and whether it is required.

Bad actions:
* “Be mindful.”
* “Eat healthier.”
* “Move more.”
* “Read more.”

Good actions:
* “Read for 10 minutes after breakfast.”
* “Take a 10-minute walk after lunch.”
* “Put your phone outside the bedroom before you start winding down.”

Check-ins:
Every check-in question MUST create usable data.
Every check-in question MUST help the user asses, understand, or move towards their objective.
Every check-in question MUST NOT ask daily questions about non-daily occuring events.
e.g. a daily question about a weekly occuring event.
Every check-in question MUST be about daily routines that help user achieve broader phase outcome.

Allowed types:
* “number”
* “scale_1_5”
* “single_choice”
* “time”
* “boolean”

Signals:
Each signal must be computed from one check-in question.
Each signal must use:

* “higher_is_better”
* “lower_is_better”
* “stable_is_better”

Safety notes:
Use “safetyNotes” only when relevant.
If there are no safety concerns, return [].

Return valid JSON only.
Match this schema exactly.
Do not add fields.
Do not remove fields.

{
"plan": {
"id": "plan-1",
"goalName": string,
"goalSummary": string,
"reasoningSummary": string,
"horizonDays": number,
"primaryOutcome": {
"label": string,
"currentValue": number | string | null,
"desiredValue": number | string | null,
"unit": string | null
},
"phases": [
{
"id": string,
"title": string,
"purpose": string,
"durationDays": number,
"entryCondition": string,
"exitCondition": string,
"dailyUserWork": string,
"actions": [
{
"id": string,
"label": string,
"trigger": string | null,
"action": string,
"duration": string | null,
"required": boolean
}
],
"checkInQuestions": [
{
"id": string,
"label": string,
"type": "number" | "scale_1_5" | "single_choice" | "time" | "boolean",
"unit": string | null,
"options": string[] | null
}
],
"signals": [
{
"id": string,
"label": string,
"computedFromQuestionId": string,
"direction": "higher_is_better" | "lower_is_better" | "stable_is_better"
}
],
"reviewRule": {
"reviewAfterDays": number,
"progressLooksGoodWhen": string,
"progressLooksMixedWhen": string,
"progressLooksPoorWhen": string
}
}
],
"safetyNotes": string[],
"insights": string[]
}
}
`;

function normalizeAdaptivePlan(raw: unknown, profile: UserProfile): AdaptivePlan {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid plan response');
  const obj = raw as Record<string, unknown>;
  const planRaw = (obj.plan ?? obj) as Record<string, unknown>;

  const id = String(planRaw.id ?? 'plan-1').trim() || 'plan-1';
  const goalName = String(planRaw.goalName ?? '').trim();
  const goalSummary = String(planRaw.goalSummary ?? '').trim();
  const reasoningSummary = String(planRaw.reasoningSummary ?? '').trim();
  const horizonDays = Number(planRaw.horizonDays ?? 28);
  const goalId = (profile as any).habitIds?.[0] || 'habit-1';

  if (!goalName || !goalSummary) {
    throw new Error('Plan missing summary fields');
  }

  // Parse primaryOutcome
  const poRaw = planRaw.primaryOutcome as Record<string, any> | undefined;
  if (!poRaw || !poRaw.label) {
    throw new Error('Plan missing primary outcome');
  }
  const primaryOutcome: PrimaryOutcome = {
    label: String(poRaw.label),
    currentValue: poRaw.currentValue ?? null,
    desiredValue: poRaw.desiredValue ?? null,
    unit: poRaw.unit ?? null,
  };

  // Parse phases
  const phasesRaw = planRaw.phases;
  if (!Array.isArray(phasesRaw) || phasesRaw.length === 0) {
    throw new Error('Plan must contain at least one phase');
  }

  const phases: PlanPhase[] = phasesRaw.map((pRaw: any, idx: number) => {
    const actionsRaw = pRaw.actions;
    const actions: PlanAction[] = Array.isArray(actionsRaw) ? actionsRaw.map((act: any) => ({
      id: String(act.id || `action-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`),
      label: String(act.label || act.action || ''),
      trigger: act.trigger || null,
      action: String(act.action || act.label || ''),
      duration: act.duration || null,
      required: act.required !== false,
    })) : [];

    const checkInQuestionsRaw = pRaw.checkInQuestions;
    const checkInQuestions: DailyCheckInQuestion[] = Array.isArray(checkInQuestionsRaw) ? checkInQuestionsRaw.map((q: any) => {
      const answerType = String(q.type || q.answerType || 'single_choice') as CheckInAnswerType;
      return {
        id: String(q.id),
        question: String(q.label || q.question || ''),
        answerType,
        required: true,
        options: Array.isArray(q.options) ? q.options.map(String) : null,
        unit: q.unit || null,
      };
    }) : [];

    const signalsRaw = pRaw.signals;
    const signals: PlanSignal[] = Array.isArray(signalsRaw) ? signalsRaw.map((sig: any) => ({
      id: String(sig.id),
      label: String(sig.label),
      computedFromQuestionId: String(sig.computedFromQuestionId),
      direction: String(sig.direction || 'higher_is_better') as any,
    })) : [];

    const rrRaw = pRaw.reviewRule as Record<string, any> | undefined;
    const reviewRule: PlanReviewRule = {
      reviewAfterDays: Number(rrRaw?.reviewAfterDays ?? pRaw.durationDays ?? 7),
      progressLooksGoodWhen: String(rrRaw?.progressLooksGoodWhen ?? ''),
      progressLooksMixedWhen: String(rrRaw?.progressLooksMixedWhen ?? ''),
      progressLooksPoorWhen: String(rrRaw?.progressLooksPoorWhen ?? ''),
    };

    return {
      id: String(pRaw.id || `phase-${idx + 1}`),
      title: String(pRaw.title || `Phase ${idx + 1}`),
      purpose: String(pRaw.purpose || ''),
      durationDays: Number(pRaw.durationDays || 7),
      entryCondition: String(pRaw.entryCondition || ''),
      exitCondition: String(pRaw.exitCondition || ''),
      dailyUserWork: String(pRaw.dailyUserWork || ''),
      actions,
      checkInQuestions,
      signals,
      reviewRule,
    };
  });

  // Parse adaptationRules
  const rulesRaw = planRaw.adaptationRules;
  const adaptationRules: NewAdaptationRule[] = Array.isArray(rulesRaw) ? rulesRaw.map((r: any, idx: number) => ({
    id: String(r.id || `rule-${idx + 1}`),
    signalId: String(r.signalId || r.signal_id || ''),
    condition: String(r.condition || 'avg_below') as any,
    threshold: Number(r.threshold ?? 3),
    action: String(r.action || 'simplify') as any,
    instruction: String(r.instruction || ''),
  })) : [];

  const safetyNotes = Array.isArray(planRaw.safetyNotes) ? planRaw.safetyNotes.map(String) : [];
  const insights = Array.isArray(planRaw.insights) ? planRaw.insights.map(String) : [];

  return {
    id,
    goalId,
    goalName,
    goalSummary,
    reasoningSummary,
    horizonDays,
    primaryOutcome,
    phases,
    adaptationRules,
    safetyNotes,
    insights,
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
      model: TASK_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(context, null, 2),
        },
      ],
      reasoning_effort: TASK_REASONING_EFFORT,
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

  if (getOpenAiApiKey()) {
    const plan = await fetchViaOpenAi(context, profile);
    return { plan, generatedAt: new Date().toISOString(), source: 'llm' };
  }
  if (getHealthInsightsProxyUrl()) {
    const plan = await fetchViaProxy(context, profile);
    return { plan, generatedAt: new Date().toISOString(), source: 'llm' };
  }

  throw new Error('Health insights model/proxy is not configured.');
}


const PHASE_ADAPTATION_SYSTEM_PROMPT = `You are a goal-attainment assistant that helps people make practical progress toward personal goals.
Your job is to review a completed phase and decide what should happen next.
Write user-facing text in the same language the user used in their request and profile context. If the language is unclear, use English.

You will receive:

* the user's onboarding context
* the full current plan
* the completed phase
* the user's recorded check-in history for that phase
* the next planned phase, if one exists

Do not follow a fixed weekly framework.
Do not force the next phase to match the original plan.
Do not assume the user should always advance.
Do not assume the user failed because they missed check-ins.
Do not invent new goals.

You may decide to:

* advance to the next phase
* repeat the current phase
* simplify the next phase
* increase difficulty
* change the trigger
* change the tracking
* add support
* insert a new phase
* end the plan if the goal is already reached

Your decision must be based on the recorded data.

First, evaluate how the completed phase went.
Then decide the next best step.
Then return the next active phase the app should show.

The next phase must be concrete, measurable, safe, and renderable by the app.

Safety rules:

* Do not mention weight, BMI, calories, body size, or appearance.
* Do not suggest fasting, restriction, supplements, medication, or intense exercise.
* Do not provide diagnosis or clinical/medical claims.
* Respect all time limits, emotional constraints, and accessibility constraints.
* If the recorded data suggests risk, overload, or distress, make the next phase easier and recommend professional support in neutral language.

Writing rules:

* Use simple language.
* Use concrete actions.
* Avoid motivational filler.
* Avoid vague advice.
* Do not ask open-ended text questions unless structured data is not possible.
* All prose fields are shown directly to the person using the app.
* Write all prose fields with "you" and "your".
* Never write "the user" in prose fields.
* Never describe the person from the outside.

Return JSON only.

Schema:

{
"phaseReview": {
"completedPhaseId": string,
"summary": string,
"progressStatus": "good" | "mixed" | "poor" | "unclear",
"dataQuality": "enough_data" | "limited_data" | "not_enough_data",
"detectedSignals": [
{
"signalId": string,
"label": string,
"value": number | string | null,
"interpretation": string
}
],
"mainReason": string
},
"decision": {
"action": "advance" | "repeat_phase" | "simplify_next_phase" | "increase_next_phase" | "change_trigger" | "change_tracking" | "insert_phase" | "end_plan",
"reason": string
},
"nextPhase": {
"id": string,
"title": string,
"purpose": string,
"durationDays": number,
"entryCondition": string,
"exitCondition": string,
"dailyUserWork": string,
"actions": [
{
"id": string,
"label": string,
"trigger": string | null,
"action": string,
"duration": string | null,
"required": boolean
}
],
"checkInQuestions": [
{
"id": string,
"label": string,
"type": "number" | "scale_1_5" | "single_choice" | "time" | "boolean",
"unit": string | null,
"options": string[] | null
}
],
"signals": [
{
"id": string,
"label": string,
"computedFromQuestionId": string,
"direction": "higher_is_better" | "lower_is_better" | "stable_is_better"
}
],
"reviewRule": {
"reviewAfterDays": number,
"progressLooksGoodWhen": string,
"progressLooksMixedWhen": string,
"progressLooksPoorWhen": string
}
},
"planUpdate": {
"shouldUpdatePlan": boolean,
"updatedGoalSummary": string | null,
"removedFuturePhaseIds": string[],
"insertedAfterPhaseId": string | null
},
"safetyNotes": string[]
}

Before returning the JSON, silently check that:

* The review uses the recorded check-in data.
* The decision matches the review.
* The next phase fits the user's goal and current progress.
* The next phase is not a generic habit-building step unless that is actually appropriate.
* The check-in questions produce structured data.
* Every signal references a real check-in question id.
* The app can render the next phase without extra explanation.
`;

const PHASE_REVIEW_SIGNAL_SCHEMA = {
  type: 'object',
  properties: {
    signalId: { type: 'string' },
    label: { type: 'string' },
    value: { anyOf: [{ type: 'number' }, { type: 'string' }, { type: 'null' }] },
    interpretation: { type: 'string' },
  },
  required: ['signalId', 'label', 'value', 'interpretation'],
  additionalProperties: false,
};

const PHASE_REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    completedPhaseId: { type: 'string' },
    summary: { type: 'string' },
    progressStatus: { type: 'string', enum: ['good', 'mixed', 'poor', 'unclear'] },
    dataQuality: { type: 'string', enum: ['enough_data', 'limited_data', 'not_enough_data'] },
    detectedSignals: {
      type: 'array',
      items: PHASE_REVIEW_SIGNAL_SCHEMA,
    },
    mainReason: { type: 'string' },
  },
  required: ['completedPhaseId', 'summary', 'progressStatus', 'dataQuality', 'detectedSignals', 'mainReason'],
  additionalProperties: false,
};

const PHASE_DECISION_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['advance', 'repeat_phase', 'simplify_next_phase', 'increase_next_phase', 'change_trigger', 'change_tracking', 'insert_phase', 'end_plan'],
    },
    reason: { type: 'string' },
  },
  required: ['action', 'reason'],
  additionalProperties: false,
};

const PLAN_UPDATE_SCHEMA = {
  type: 'object',
  properties: {
    shouldUpdatePlan: { type: 'boolean' },
    updatedGoalSummary: { type: ['string', 'null'] },
    removedFuturePhaseIds: {
      type: 'array',
      items: { type: 'string' },
    },
    insertedAfterPhaseId: { type: ['string', 'null'] },
  },
  required: ['shouldUpdatePlan', 'updatedGoalSummary', 'removedFuturePhaseIds', 'insertedAfterPhaseId'],
  additionalProperties: false,
};

const PHASE_ADAPTATION_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    phaseReview: PHASE_REVIEW_SCHEMA,
    decision: PHASE_DECISION_SCHEMA,
    nextPhase: PLAN_PHASE_SCHEMA,
    planUpdate: PLAN_UPDATE_SCHEMA,
    safetyNotes: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['phaseReview', 'decision', 'nextPhase', 'planUpdate', 'safetyNotes'],
  additionalProperties: false,
};

async function fetchWeekAdaptationViaOpenAi(
  profile: UserProfile,
  plan: AdaptivePlan,
  weekNumber: number,
  checkInEntries: any[]
): Promise<PlanWeek> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const context = {
    userProfile: {
      name: profile.name,
      age: profile.age,
      sex: profile.sex,
      habitIds: (profile as any).habitIds,
      goalDetails: (profile as any).goalDetails,
    },
    currentPlan: plan,
    completedPhaseId: plan.phases?.[weekNumber - 2]?.id || 'phase-1',
    completedPhase: plan.phases?.[weekNumber - 2] || plan.phases?.[0],
    checkInHistoryForPhase: checkInEntries,
    nextPlannedPhase: plan.phases?.[weekNumber - 1] || null,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: TASK_MODEL,
      messages: [
        { role: 'system', content: PHASE_ADAPTATION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(context, null, 2),
        },
      ],
      reasoning_effort: TASK_REASONING_EFFORT,
      temperature: HEALTH_INSIGHTS_TEMPERATURE,
      max_completion_tokens: PLAN_MAX_OUTPUT_TOKENS,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'adapted_phase',
          strict: true,
          schema: PHASE_ADAPTATION_RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI adaptation request failed (${res.status})`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty model response');

  const parsed = parseModelJson(text) as any;
  const nextPhaseRaw = parsed.nextPhase;
  if (!nextPhaseRaw) throw new Error('Invalid adapted phase returned by model');

  const actionsRaw = nextPhaseRaw.actions;
  const actions: PlanAction[] = Array.isArray(actionsRaw) ? actionsRaw.map((act: any, idx: number) => ({
    id: String(act.id || `action-${weekNumber}-${idx + 1}`),
    label: String(act.label || act.action || ''),
    trigger: act.trigger || null,
    action: String(act.action || act.label || ''),
    duration: act.duration || null,
    required: act.required !== false,
  })) : [];

  const checkInQuestionsRaw = nextPhaseRaw.checkInQuestions;
  const checkInQuestions: DailyCheckInQuestion[] = Array.isArray(checkInQuestionsRaw) ? checkInQuestionsRaw.map((q: any) => {
    const answerType = String(q.type || q.answerType || 'single_choice') as CheckInAnswerType;
    return {
      id: String(q.id),
      question: String(q.label || q.question || ''),
      answerType,
      required: true,
      options: Array.isArray(q.options) ? q.options.map(String) : null,
      unit: q.unit || null,
    };
  }) : [];

  const signalsRaw = nextPhaseRaw.signals;
  const signals: PlanSignal[] = Array.isArray(signalsRaw) ? signalsRaw.map((sig: any) => ({
    id: String(sig.id),
    label: String(sig.label),
    computedFromQuestionId: String(sig.computedFromQuestionId),
    direction: String(sig.direction || 'higher_is_better') as any,
  })) : [];

  const rrRaw = nextPhaseRaw.reviewRule as Record<string, any> | undefined;
  const reviewRule: PlanReviewRule = {
    reviewAfterDays: Number(rrRaw?.reviewAfterDays ?? nextPhaseRaw.durationDays ?? 7),
    progressLooksGoodWhen: String(rrRaw?.progressLooksGoodWhen ?? ''),
    progressLooksMixedWhen: String(rrRaw?.progressLooksMixedWhen ?? ''),
    progressLooksPoorWhen: String(rrRaw?.progressLooksPoorWhen ?? ''),
  };

  const parsedPhase: PlanPhase = {
    id: String(nextPhaseRaw.id || `phase-${weekNumber}`),
    title: String(nextPhaseRaw.title || `Phase ${weekNumber}`),
    purpose: String(nextPhaseRaw.purpose || ''),
    durationDays: Number(nextPhaseRaw.durationDays || 7),
    entryCondition: String(nextPhaseRaw.entryCondition || ''),
    exitCondition: String(nextPhaseRaw.exitCondition || ''),
    dailyUserWork: String(nextPhaseRaw.dailyUserWork || ''),
    actions,
    checkInQuestions,
    signals,
    reviewRule,
  };

  const parsedWeek: PlanWeek = {
    weekNumber,
    status: 'active',
    focus: parsedPhase.title,
    weeklyTarget: parsedPhase.purpose,
    whyThisWeek: parsedPhase.purpose,
    planSteps: parsedPhase.actions.map(a => `${a.trigger ? `${a.trigger} → ` : ''}${a.action}${a.duration ? ` → ${a.duration}` : ''}`),
    planForTheWeek: parsedPhase.dailyUserWork,
    experiments: [],
    dailyCheckInQuestions: parsedPhase.checkInQuestions,
    weeklyReviewSignals: parsedPhase.signals.map(s => s.label),
  };

  return parsedWeek;
}

export async function adaptProvisionalWeek(
  profile: UserProfile,
  plan: AdaptivePlan,
  weekNumber: number,
  checkInEntries: any[]
): Promise<PlanWeek> {
  if (getOpenAiApiKey()) {
    return await fetchWeekAdaptationViaOpenAi(profile, plan, weekNumber, checkInEntries);
  }
  throw new Error('Health insights model is not configured.');
}
