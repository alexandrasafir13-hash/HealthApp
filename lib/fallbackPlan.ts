import { habitCatalog } from '@/data/onboardingOptions';
import { rankGoalIds } from '@/lib/fallbackRoutine';
import { GoalDetails } from '@/types/onboarding';
import {
  AdaptivePlan,
  DailyCheckInQuestion,
  PLAN_WEEK_COUNT,
  PlanGenerationResult,
  PlanWeek,
  PrimaryMetric,
} from '@/types/plan';

function weekOneQuestions(goalId: string): DailyCheckInQuestion[] {
  if (goalId === 'screen-time') {
    return [
      {
        id: 'w1-screen-hours',
        question: 'How many hours of screen time today?',
        answerType: 'number',
        required: true,
        options: null,
        unit: 'hours',
      },
      {
        id: 'w1-noticed-trigger',
        question: 'Did you notice your usual scroll trigger today?',
        answerType: 'single_choice',
        required: true,
        options: ['Yes', 'Partially', 'No'],
        unit: null,
      },
      {
        id: 'w1-observe-effort',
        question: 'How hard was it to stay aware of your screen use?',
        answerType: 'scale_1_5',
        required: true,
        options: null,
        unit: null,
      },
      {
        id: 'w1-first-scroll',
        question: 'What time was your first long scroll today?',
        answerType: 'time',
        required: true,
        options: null,
        unit: null,
      },
    ];
  }

  return [
    {
      id: 'w1-observe-step',
      question: 'Did you complete today’s observation step?',
      answerType: 'single_choice',
      required: true,
      options: ['Yes', 'Partially', 'No'],
      unit: null,
    },
    {
      id: 'w1-observe-effort',
      question: 'How hard was it to notice your pattern today?',
      answerType: 'scale_1_5',
      required: true,
      options: null,
      unit: null,
    },
    {
      id: 'w1-pattern-count',
      question: 'How many times did you notice the pattern today?',
      answerType: 'number',
      required: true,
      options: null,
      unit: 'times',
    },
    {
      id: 'w1-pattern-time',
      question: 'What time did the pattern show up most clearly?',
      answerType: 'time',
      required: true,
      options: null,
      unit: null,
    },
  ];
}

function buildWeek(goalId: string, goalName: string, weekNumber: number): PlanWeek {
  const status = weekNumber === 1 ? 'active' : 'provisional';
  const focus =
    weekNumber === 1
      ? `Understand your current ${goalName.toLowerCase()} pattern`
      : weekNumber === 2
        ? `Start small with ${goalName.toLowerCase()}`
        : weekNumber === 3
          ? `Build consistency with ${goalName.toLowerCase()}`
          : `Test whether ${goalName.toLowerCase()} runs on autopilot`;

  if (weekNumber === 1) {
    const planSteps = [
      `After a routine you already do → notice one ${goalName.toLowerCase()} cue → takes 10 seconds`,
      `When the cue appears → pause and name what you feel → takes 15 seconds`,
      `Before bed → recall when the cue showed up today → takes 20 seconds`,
    ];
    const whyThisWeek = 'Week 1 is observation only — no behavior change yet.';
    return {
      weekNumber,
      status,
      focus,
      weeklyTarget: 'Notice your pattern honestly for four days.',
      whyThisWeek,
      planSteps,
      planForTheWeek: planSteps.map((step, index) => `${index + 1}. ${step}`).join('\n'),
      experiments: [],
      dailyCheckInQuestions: weekOneQuestions(goalId),
      weeklyReviewSignals: ['Observation step completion', 'Pattern awareness rating', 'Cue timing'],
    };
  }

  const preview =
    weekNumber === 2
      ? `You'll likely try a 2–5 minute version of ${goalName.toLowerCase()} once per day.`
      : weekNumber === 3
        ? `You'll likely protect a small streak and plan for one common obstacle.`
        : `You'll likely rely less on reminders and notice whether the cue fires on its own.`;

  return {
    weekNumber,
    status,
    focus,
    weeklyTarget:
      weekNumber === 2
        ? 'One tiny action per day, anchored to an existing routine.'
        : weekNumber === 3
          ? 'Never miss twice — keep the streak alive.'
          : 'See if the habit starts without prompting.',
    whyThisWeek: null,
    planSteps: [],
    planForTheWeek: `${preview} Depends on Week 1 review signals.`,
    experiments: [],
    dailyCheckInQuestions: [],
    weeklyReviewSignals: [],
  };
}

function primaryMetricForGoal(goalId: string, goalName: string): PrimaryMetric {
  if (goalId === 'screen-time') {
    return { label: 'Daily screen time', unit: 'hours', baselineValue: null };
  }
  if (goalId === 'hydration') {
    return { label: 'Daily water intake', unit: 'glasses', baselineValue: null };
  }
  return { label: `${goalName} progress`, unit: null, baselineValue: null };
}

export function buildFallbackAdaptivePlan(
  habitIds: string[],
  goalDetails: GoalDetails = {},
): PlanGenerationResult {
  const ranked = rankGoalIds(habitIds, goalDetails);
  const goalId = ranked[0] ?? 'sleep-schedule';
  const habit = habitCatalog.find((h) => h.id === goalId);
  const goalName = habit?.title ?? goalId;
  const metric = primaryMetricForGoal(goalId, goalName);
  const weeks = Array.from({ length: PLAN_WEEK_COUNT }, (_, index) =>
    buildWeek(goalId, goalName, index + 1),
  );
  const weekOne = weeks[0];
  const [q0, q1, q2] = weekOne.dailyCheckInQuestions.map((q) => q.id);

  const plan: AdaptivePlan = {
    id: 'plan-1',
    goalId,
    goalName,
    goalSummary: `A 4-week plan to improve ${goalName.toLowerCase()} through observation, then small steps.`,
    baselineSummary: `Baseline: ${metric.label} — not set yet${metric.unit ? ` ${metric.unit}` : ''}`,
    desiredOutcome: `Target: ${metric.label} — improve steadily over four weeks`,
    primaryMetric: metric,
    weeks,
    adjustmentRules: [
      {
        signalId: q1,
        condition: 'avg_below',
        threshold: 2,
        adjustment: 'simplify_action',
        instruction: 'Make Week 2 observation steps shorter and easier to notice.',
      },
      {
        signalId: q2,
        condition: 'avg_above',
        threshold: 4,
        adjustment: 'reduce_duration',
        instruction: 'Keep Week 2 actions under 2 minutes and tie them to a clearer cue.',
      },
      {
        signalId: q0,
        condition: 'skipped_days_gte',
        threshold: 2,
        adjustment: 'shift_cue',
        instruction: 'Move the Week 2 cue to a time of day that showed up most in check-ins.',
      },
    ],
  };

  return {
    plan,
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}
