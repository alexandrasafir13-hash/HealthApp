import { habitCatalog } from '@/data/onboardingOptions';
import { GoalDetails } from '@/types/onboarding';
import {
  ROUTINE_OPTION_COUNT,
  RoutineOption,
  RoutineProposalSet,
  RoutineStep,
} from '@/types/routine';

const GOAL_PRIORITY = [
  'sleep-schedule',
  'screen-time',
  'hydration',
  'exercise-routine',
  'eating-habits',
] as const;

const FALLBACK_STEPS: Record<string, RoutineStep[]> = {
  'sleep-schedule': [
    {
      title: 'Pick a wind-down time',
      description: 'Choose a time to start relaxing — about 30–45 minutes before you want to sleep.',
      timeHint: 'Evening',
    },
    {
      title: 'Dim the lights',
      description: 'Lower bright overhead lights and switch to softer lamps to signal bedtime.',
      timeHint: 'Before bed',
    },
    {
      title: 'Phone-free buffer',
      description: 'Put your phone on charge outside the bedroom for the last hour before sleep.',
      timeHint: 'Before bed',
    },
    {
      title: 'Same wake time',
      description: 'Wake up within the same 30-minute window each day, even on weekends.',
      timeHint: 'Morning',
    },
  ],
  'exercise-routine': [
    {
      title: 'Five-minute morning stretch',
      description: 'Roll shoulders, reach overhead, and loosen your hips before the day starts.',
      timeHint: 'Morning',
    },
    {
      title: 'Walk after a meal',
      description: 'Take a 10-minute walk after lunch or dinner — no pace target needed.',
      timeHint: 'After meals',
    },
    {
      title: 'Movement reminder',
      description: 'Set one phone reminder to stand and move for two minutes mid-afternoon.',
      timeHint: 'Afternoon',
    },
    {
      title: 'Prep easy shoes',
      description: 'Leave walking shoes by the door so a short walk takes less effort.',
      timeHint: 'Anytime',
    },
  ],
  'eating-habits': [
    {
      title: 'Plan one meal',
      description: 'Decide tomorrow’s breakfast or lunch tonight so you’re not deciding when hungry.',
      timeHint: 'Evening',
    },
    {
      title: 'Add one vegetable',
      description: 'Include one extra serving of vegetables at your main meal today.',
      timeHint: 'Lunch or dinner',
    },
    {
      title: 'Snack swap',
      description: 'Keep one ready-to-eat healthy snack visible in the fridge or counter.',
      timeHint: 'Anytime',
    },
    {
      title: 'Slow first bites',
      description: 'Put your fork down between the first few bites to notice fullness sooner.',
      timeHint: 'Meals',
    },
  ],
  hydration: [
    {
      title: 'Morning glass',
      description: 'Drink one full glass of water right after you wake up.',
      timeHint: 'Morning',
    },
    {
      title: 'Bottle in sight',
      description: 'Fill a water bottle and keep it where you work or relax.',
      timeHint: 'Anytime',
    },
    {
      title: 'Meal pairing',
      description: 'Have a glass of water with each main meal today.',
      timeHint: 'Meals',
    },
    {
      title: 'Afternoon top-up',
      description: 'Refill your bottle once in the afternoon before you feel thirsty.',
      timeHint: 'Afternoon',
    },
  ],
  'screen-time': [
    {
      title: 'Check your baseline',
      description: 'Glance at today’s screen time so you know your starting point.',
      timeHint: 'Morning',
    },
    {
      title: 'Quiet hour',
      description: 'Pick one hour tonight with no social apps — messages and calls are fine.',
      timeHint: 'Evening',
    },
    {
      title: 'Charge away from bed',
      description: 'Charge your phone outside the bedroom overnight.',
      timeHint: 'Before bed',
    },
    {
      title: 'Replace one scroll',
      description: 'Swap one usual scroll session for a 5-minute walk or stretch.',
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
    stepCount: 3,
  },
  {
    suffix: 'balanced',
    why: (title: string) =>
      `A balanced daily plan for ${title.toLowerCase()} based on what you shared in onboarding.`,
    intro: (title: string) => `A steady routine to build ${title.toLowerCase()} into your day.`,
    stepCount: 4,
  },
  {
    suffix: 'focused',
    why: (title: string) =>
      `A more structured approach to ${title.toLowerCase()} if you are ready to commit a bit more.`,
    intro: (title: string) => `A fuller routine to make ${title.toLowerCase()} stick.`,
    stepCount: 4,
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
  stepCount: number,
): RoutineOption {
  const habit = habitCatalog.find((h) => h.id === goalId);
  const allSteps = FALLBACK_STEPS[goalId] ?? FALLBACK_STEPS['sleep-schedule'];

  return {
    id: optionId,
    primaryGoalId: goalId,
    primaryGoalTitle: habit?.title ?? goalId,
    whyThisGoal,
    intro,
    steps: allSteps.slice(0, stepCount),
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
          variant.stepCount,
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
