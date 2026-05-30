import { habitCatalog } from '@/data/onboardingOptions';
import { rankGoalIds } from '@/lib/fallbackRoutine';
import { GoalDetails } from '@/types/onboarding';
import {
  AdaptivePlan,
  DailyCheckInQuestion,
  PLAN_WEEK_COUNT,
  PlanGenerationResult,
  PlanWeek,
  SuggestedExperiment,
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
        whyItMatters: 'Helps track whether the plan is moving your baseline.',
      },
      {
        id: `w${weekNumber}-blocker`,
        question: 'What got in the way today?',
        answerType: 'short_text',
        required: true,
        options: null,
        whyItMatters: 'Repeated blockers show what to adjust next week.',
      },
      {
        id: `w${weekNumber}-difficulty`,
        question: 'How hard did the plan feel today?',
        answerType: 'scale_1_5',
        required: true,
        options: null,
        whyItMatters: 'Difficulty trend guides whether next week should be easier or harder.',
      },
      {
        id: `w${weekNumber}-tomorrow`,
        question: 'Do you want tomorrow to be easier, the same, or slightly harder?',
        answerType: 'single_choice',
        required: true,
        options: ['Easier', 'Same', 'Slightly harder'],
        whyItMatters: 'Lets the plan adapt day to day within the week.',
      },
    ];
  }

  return [
    {
      id: `w${weekNumber}-worked`,
      question: 'What worked better than expected today?',
      answerType: 'short_text',
      required: true,
      options: null,
      whyItMatters: 'Shows what to keep or expand next week.',
    },
    {
      id: `w${weekNumber}-blocker`,
      question: 'What got in the way today?',
      answerType: 'short_text',
      required: true,
      options: null,
      whyItMatters: 'Repeated blockers show what to adjust next week.',
      },
    {
      id: `w${weekNumber}-difficulty`,
      question: 'How hard did the plan feel today?',
      answerType: 'scale_1_5',
      required: true,
      options: null,
      whyItMatters: 'Difficulty trend guides weekly adjustments.',
    },
    {
      id: `w${weekNumber}-tomorrow`,
      question: 'Do you want tomorrow to be easier, the same, or slightly harder?',
      answerType: 'single_choice',
      required: true,
      options: ['Easier', 'Same', 'Slightly harder'],
      whyItMatters: 'Helps the plan adapt within the week.',
    },
  ];
}

function experimentsForGoal(goalId: string): SuggestedExperiment[] {
  if (goalId === 'screen-time') {
    return [
      {
        title: 'Quiet hour experiment',
        description: 'Pick one evening hour with no social apps.',
        whenToUse: 'Try on a low-stress evening when you want more wind-down time.',
      },
      {
        title: 'Phone-outside-bedroom trial',
        description: 'Charge your phone outside the bedroom for one night.',
        whenToUse: 'Try when late scrolling is your main blocker.',
      },
    ];
  }
  if (goalId === 'hydration') {
    return [
      {
        title: 'Morning water experiment',
        description: 'Drink one glass of water right after waking.',
        whenToUse: 'Try on mornings when you feel sluggish early in the day.',
      },
    ];
  }
  return [
    {
      title: 'Small win experiment',
      description: 'Try one tiny version of this week’s focus and notice what happens.',
      whenToUse: 'Use on days when the full target feels like too much.',
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
    target:
      weekNumber === 1
        ? 'Collect honest daily check-ins and try one small experiment when it fits.'
        : 'Continue check-ins and adjust based on what felt realistic last week.',
    whyThisWeek:
      weekNumber === 1
        ? 'Week 1 is about learning, not perfection.'
        : 'This week may change after your weekly review.',
    weeklyStrategy:
      weekNumber === 1
        ? 'Notice patterns, try experiments optionally, and report what felt realistic.'
        : 'Provisional — will adapt after your end-of-week review.',
    suggestedExperiments: weekNumber === 1 ? experimentsForGoal(goalId) : [],
    dailyCheckInQuestions: weekQuestions(goalId, weekNumber),
    endOfWeekReviewSignals:
      weekNumber === 1
        ? [
            'Average difficulty rating',
            'Repeated blockers',
            'What worked better than expected',
            'Preference for easier/same/harder days',
          ]
        : ['Will be set after Week 1 review'],
  };
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
    startingPoint: {
      summary: `You want to work on ${goalName.toLowerCase()}. Week 1 focuses on learning your baseline.`,
      knownMetrics: [],
      assumptions: ['You are starting with small, reversible changes.'],
    },
    desiredOutcome: `Feel more in control of ${goalName.toLowerCase()} with a plan that adapts to your real week.`,
    planPrinciple: 'Consistency and learning first, then gradual improvement.',
    weeks: Array.from({ length: PLAN_WEEK_COUNT }, (_, index) =>
      buildWeek(goalId, goalName, index + 1),
    ),
    adaptationRules: [
      {
        condition: 'Average difficulty stays high for several days',
        adjustment: 'Make the next week easier and reduce optional experiments.',
      },
      {
        condition: 'User often asks for harder days and reports low blockers',
        adjustment: 'Slightly increase the next week’s target.',
      },
    ],
  };

  return {
    plan,
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}
