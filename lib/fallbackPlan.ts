import { habitCatalog } from '@/data/onboardingOptions';
import { rankGoalIds } from '@/lib/fallbackRoutine';
import { GoalDetails } from '@/types/onboarding';
import {
  AdaptivePlan,
  DailyCheckInQuestion,
  PLAN_WEEK_COUNT,
  PlanGenerationResult,
  PlanWeek,
  PlanExperiment,
  PrimaryMetric,
} from '@/types/plan';

function weekQuestions(goalId: string, weekNumber: number): DailyCheckInQuestion[] {
  if (goalId === 'screen-time') {
    return [
      {
        id: `w${weekNumber}-screen-time`,
        question: 'What was your screen time today?',
        answerType: 'short_text',
        required: true,
        options: null,
        unit: null,
      },
      {
        id: `w${weekNumber}-blocker`,
        question: 'What got in the way today?',
        answerType: 'short_text',
        required: true,
        options: null,
        unit: null,
      },
      {
        id: `w${weekNumber}-helped`,
        question: 'What helped more than you expected?',
        answerType: 'short_text',
        required: true,
        options: null,
        unit: null,
      },
      {
        id: `w${weekNumber}-fit`,
        question: 'How well did this week’s plan fit your real day?',
        answerType: 'scale_1_5',
        required: true,
        options: null,
        unit: null,
      },
    ];
  }

  return [
    {
      id: `w${weekNumber}-progress`,
      question: 'What progress did you notice today?',
      answerType: 'short_text',
      required: true,
      options: null,
      unit: null,
    },
    {
      id: `w${weekNumber}-blocker`,
      question: 'What got in the way today?',
      answerType: 'short_text',
      required: true,
      options: null,
      unit: null,
    },
    {
      id: `w${weekNumber}-helped`,
      question: 'What helped more than you expected?',
      answerType: 'short_text',
      required: true,
      options: null,
      unit: null,
    },
    {
      id: `w${weekNumber}-fit`,
      question: 'How well did this week’s plan fit your real day?',
      answerType: 'scale_1_5',
      required: true,
      options: null,
      unit: null,
    },
  ];
}

function experimentsForGoal(goalId: string): PlanExperiment[] {
  if (goalId === 'screen-time') {
    return [
      {
        title: 'Quiet hour experiment',
        description: 'Pick one evening hour with no social apps.',
        whatItTests: 'Whether a fixed quiet hour reduces late scrolling.',
      },
      {
        title: 'Phone-outside-bedroom trial',
        description: 'Charge your phone outside the bedroom for one night.',
        whatItTests: 'Whether removing the phone from bed changes your wind-down.',
      },
    ];
  }
  if (goalId === 'hydration') {
    return [
      {
        title: 'Morning water experiment',
        description: 'Drink one glass of water right after waking.',
        whatItTests: 'Whether an early water cue makes hydration easier later.',
      },
    ];
  }
  return [
    {
      title: 'Small win experiment',
      description: 'Try one tiny version of this week’s focus and notice what happens.',
      whatItTests: 'Whether a smaller version of the plan still moves you forward.',
    },
  ];
}

function buildWeek(goalId: string, goalName: string, weekNumber: number): PlanWeek {
  const status = weekNumber === 1 ? 'active' : 'provisional';
  const focus =
    weekNumber === 1
      ? `Learn your baseline for ${goalName.toLowerCase()}`
      : weekNumber === 2
        ? `Build consistency with ${goalName.toLowerCase()}`
        : weekNumber === 3
          ? `Stretch what is working for ${goalName.toLowerCase()}`
          : `Lock in a sustainable ${goalName.toLowerCase()} rhythm`;

  return {
    weekNumber,
    status,
    focus,
    weeklyTarget:
      weekNumber === 1
        ? 'Collect honest daily check-ins and notice what fits your real days.'
        : 'Continue check-ins; this week may change after your review.',
    planForTheWeek:
      weekNumber === 1
        ? 'Report progress, blockers, and what helped. Optional experiments are available if they fit.'
        : 'Provisional — will adapt after your end-of-week review.',
    experiments: weekNumber === 1 ? experimentsForGoal(goalId) : [],
    dailyCheckInQuestions: weekQuestions(goalId, weekNumber),
    weeklyReviewSignals:
      weekNumber === 1
        ? [
            'Average plan-fit rating',
            'Repeated blockers',
            'What helped more than expected',
            'Whether experiments were useful',
          ]
        : ['Will be set after Week 1 review'],
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

  const plan: AdaptivePlan = {
    id: 'plan-1',
    goalId,
    goalName,
    goalSummary: `A 4-week plan to improve ${goalName.toLowerCase()} through daily check-ins and weekly adjustments.`,
    baselineSummary: `You want to work on ${goalName.toLowerCase()}. Week 1 focuses on learning your baseline.`,
    desiredOutcome: `Feel more in control of ${goalName.toLowerCase()} with a plan that adapts to your real week.`,
    primaryMetric: primaryMetricForGoal(goalId, goalName),
    weeks: Array.from({ length: PLAN_WEEK_COUNT }, (_, index) =>
      buildWeek(goalId, goalName, index + 1),
    ),
    adjustmentRules: [
      {
        signal: 'Plan-fit ratings stay low for several days',
        nextWeekAdjustment: 'Make the next week easier and offer fewer experiments.',
      },
      {
        signal: 'User reports low blockers and high plan-fit',
        nextWeekAdjustment: 'Slightly increase the next week’s target.',
      },
    ],
  };

  return {
    plan,
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}
