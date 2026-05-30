import { habitCatalog } from '@/data/onboardingOptions';
import { GoalDetails } from '@/types/onboarding';
import {
  ROUTINE_OPTION_COUNT,
  RoutineDailyAction,
  RoutineOption,
  RoutineProposalSet,
} from '@/types/routine';

const GOAL_PRIORITY = [
  'sleep-schedule',
  'screen-time',
  'hydration',
  'exercise-routine',
  'eating-habits',
] as const;

const FALLBACK_OVERVIEW_TIPS: Record<string, string[]> = {
  'sleep-schedule': [
    'A steady bedtime matters more than a perfect one — pick something you can repeat.',
    'Light and screens in the last hour often decide how fast you fall asleep.',
  ],
  'exercise-routine': [
    'Short movement beats a perfect workout you skip.',
    'Pair movement with something you already do, like after a meal.',
  ],
  'eating-habits': [
    'Decide meals before you are hungry — it cuts impulsive choices.',
    'One extra vegetable today is a win; you do not need a full diet overhaul.',
  ],
  hydration: [
    'Thirst often shows up late — sip before you feel dry.',
    'Keep water where you actually spend time, not just in the kitchen.',
  ],
  'screen-time': [
    'Evening screen cutoffs help sleep more than all-day limits at first.',
    'Charge away from bed so the phone is not the first thing you reach for.',
  ],
};

const FALLBACK_ACTIONS: Record<string, RoutineDailyAction[]> = {
  'sleep-schedule': [
    {
      title: 'Set a wind-down alarm',
      doneWhen: 'An alarm fired at the time you chose to start relaxing before bed.',
      timeHint: 'Evening',
    },
    {
      title: 'Dim overhead lights 30 minutes before bed',
      doneWhen: 'Bright ceiling lights were off and you used softer lighting before sleep.',
      timeHint: 'Before bed',
    },
    {
      title: 'Charge phone outside the bedroom',
      doneWhen: 'Your phone is on its charger outside the bedroom before you get into bed.',
      timeHint: 'Before bed',
    },
    {
      title: 'Wake within the same 30-minute window',
      doneWhen: 'You got out of bed within 30 minutes of your chosen wake time.',
      timeHint: 'Morning',
    },
  ],
  'exercise-routine': [
    {
      title: 'Stretch for 5 minutes after waking',
      doneWhen: 'You spent at least 5 minutes stretching shoulders, back, and hips.',
      timeHint: 'Morning',
    },
    {
      title: 'Walk 10 minutes after a meal',
      doneWhen: 'You walked at least 10 minutes after lunch or dinner.',
      timeHint: 'After meals',
    },
    {
      title: 'Stand and move for 2 minutes mid-afternoon',
      doneWhen: 'You stood up and moved for at least 2 minutes between noon and 5pm.',
      timeHint: 'Afternoon',
    },
    {
      title: 'Leave walking shoes by the door',
      doneWhen: 'Your walking shoes are placed by the door before the end of the day.',
      timeHint: 'Anytime',
    },
  ],
  'eating-habits': [
    {
      title: 'Decide tomorrow’s breakfast tonight',
      doneWhen: 'You wrote down or decided exactly what you will eat for breakfast tomorrow.',
      timeHint: 'Evening',
    },
    {
      title: 'Add 1 serving of vegetables at a main meal',
      doneWhen: 'You ate at least one extra serving of vegetables at lunch or dinner.',
      timeHint: 'Lunch or dinner',
    },
    {
      title: 'Put 1 healthy snack in sight',
      doneWhen: 'One ready-to-eat healthy snack is visible on the counter or fridge shelf.',
      timeHint: 'Anytime',
    },
    {
      title: 'Put fork down for the first 3 bites',
      doneWhen: 'You paused between your first three bites at one meal today.',
      timeHint: 'Meals',
    },
  ],
  hydration: [
    {
      title: 'Drink 1 full glass of water after waking',
      doneWhen: 'You finished one full glass of water within 30 minutes of getting up.',
      timeHint: 'Morning',
    },
    {
      title: 'Fill a water bottle and keep it in sight',
      doneWhen: 'A filled bottle is sitting where you work or relax.',
      timeHint: 'Anytime',
    },
    {
      title: 'Drink 1 glass of water with a main meal',
      doneWhen: 'You drank at least one glass of water during lunch or dinner.',
      timeHint: 'Meals',
    },
    {
      title: 'Refill your bottle once in the afternoon',
      doneWhen: 'You refilled your water bottle once between noon and 5pm.',
      timeHint: 'Afternoon',
    },
  ],
  'screen-time': [
    {
      title: 'Check today’s screen time once',
      doneWhen: 'You opened screen time settings and looked at today’s total.',
      timeHint: 'Morning',
    },
    {
      title: 'Skip social apps for 1 chosen hour tonight',
      doneWhen: 'You did not open social apps during the hour you picked this evening.',
      timeHint: 'Evening',
    },
    {
      title: 'Charge phone outside the bedroom overnight',
      doneWhen: 'Your phone is charging outside the bedroom before sleep.',
      timeHint: 'Before bed',
    },
    {
      title: 'Replace 1 scroll with a 5-minute walk',
      doneWhen: 'You swapped one usual scroll session for at least 5 minutes of walking.',
      timeHint: 'Anytime',
    },
  ],
};

const SINGLE_GOAL_VARIANTS = [
  {
    suffix: 'gentle',
    why: (title: string) =>
      `A low-pressure start for ${title.toLowerCase()} — good if you want the smallest possible first step.`,
    intro: (title: string) => `Three easy habits to ease into ${title.toLowerCase()}.`,
    actionCount: 3,
  },
  {
    suffix: 'balanced',
    why: (title: string) =>
      `A balanced daily plan for ${title.toLowerCase()} based on what you shared in onboarding.`,
    intro: (title: string) => `A steady routine to build ${title.toLowerCase()} into your day.`,
    actionCount: 4,
  },
  {
    suffix: 'focused',
    why: (title: string) =>
      `A more structured approach to ${title.toLowerCase()} if you are ready to commit a bit more.`,
    intro: (title: string) => `A fuller routine to make ${title.toLowerCase()} stick.`,
    actionCount: 4,
  },
] as const;

function scoreGoalId(id: string, details: GoalDetails): number {
  const answers = details[id] ?? {};
  let score = GOAL_PRIORITY.indexOf(id as (typeof GOAL_PRIORITY)[number]);
  if (score < 0) score = GOAL_PRIORITY.length;

  if (id === 'sleep-schedule') {
    const hours = Number.parseFloat(String(answers['sleep-hours'] ?? ''));
    if (Number.isFinite(hours) && hours < 7) score -= 3;
    if (answers['sleep-challenge']) score -= 1;
  }
  if (id === 'screen-time') {
    if (answers['phone-hours'] === 'over-6' || answers['phone-hours'] === '4-6') score -= 2;
    const uses = answers['phone-uses'];
    if (Array.isArray(uses) && uses.length >= 3) score -= 1;
  }
  if (id === 'hydration') {
    if (answers['water-intake'] === 'under-4') score -= 2;
    if (Array.isArray(answers['hydration-barriers']) && answers['hydration-barriers'].length > 0) {
      score -= 1;
    }
  }
  if (id === 'exercise-routine') {
    if (answers['activity-level'] === 'mostly-sitting') score -= 2;
  }
  if (id === 'eating-habits') {
    if (answers['home-cooked-meals'] === 'rarely' || answers['home-cooked-meals'] === 'some-days') {
      score -= 1;
    }
  }

  return score;
}

export function rankGoalIds(habitIds: string[], goalDetails: GoalDetails = {}): string[] {
  return [...habitIds].sort((a, b) => scoreGoalId(a, goalDetails) - scoreGoalId(b, goalDetails));
}

function buildOptionForGoal(
  goalId: string,
  optionId: string,
  whyThisGoal: string,
  intro: string,
  actionCount: number,
): RoutineOption {
  const habit = habitCatalog.find((h) => h.id === goalId);
  const allActions = FALLBACK_ACTIONS[goalId] ?? FALLBACK_ACTIONS['sleep-schedule'];
  const overviewTips = FALLBACK_OVERVIEW_TIPS[goalId] ?? FALLBACK_OVERVIEW_TIPS['sleep-schedule'];

  return {
    id: optionId,
    primaryGoalId: goalId,
    primaryGoalTitle: habit?.title ?? goalId,
    whyThisGoal,
    intro,
    overviewTips,
    dailyActions: allActions.slice(0, actionCount),
  };
}

export function buildFallbackRoutineProposals(
  habitIds: string[],
  goalDetails: GoalDetails = {},
): RoutineProposalSet {
  const ranked = rankGoalIds(habitIds, goalDetails);
  const options: RoutineOption[] = [];

  if (ranked.length === 0) {
    ranked.push('sleep-schedule');
  }

  if (ranked.length === 1) {
    const goalId = ranked[0];
    const habit = habitCatalog.find((h) => h.id === goalId);
    const title = habit?.title ?? goalId;
    for (const variant of SINGLE_GOAL_VARIANTS) {
      options.push(
        buildOptionForGoal(
          goalId,
          `${goalId}-${variant.suffix}`,
          variant.why(title),
          variant.intro(title),
          variant.actionCount,
        ),
      );
    }
  } else {
    const goalIdsForOptions = ranked.slice(0, ROUTINE_OPTION_COUNT);
    while (goalIdsForOptions.length < ROUTINE_OPTION_COUNT) {
      goalIdsForOptions.push(ranked[0]);
    }

    goalIdsForOptions.forEach((goalId, index) => {
      const habit = habitCatalog.find((h) => h.id === goalId);
      const title = habit?.title ?? goalId;
      const duplicate = goalIdsForOptions.indexOf(goalId) !== index;
      options.push(
        buildOptionForGoal(
          goalId,
          duplicate ? `${goalId}-alt-${index}` : `${goalId}-option-${index + 1}`,
          duplicate
            ? `Another angle on ${title.toLowerCase()} with a slightly different daily mix.`
            : `Based on your answers, ${title.toLowerCase()} could give you a strong day-to-day payoff.`,
          duplicate
            ? `An alternate ${title.toLowerCase()} routine with a different emphasis.`
            : `A starter routine focused on ${title.toLowerCase()}.`,
          duplicate ? 3 : 4,
        ),
      );
    });
  }

  return {
    options: options.slice(0, ROUTINE_OPTION_COUNT),
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}
