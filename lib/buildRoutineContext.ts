import { findGoalQuestion, labelForGoalAnswer } from '@/data/onboardingGoalQuestions';
import { habitCatalog, sexOptions } from '@/data/onboardingOptions';
import { GoalDetails, UserProfile } from '@/types/onboarding';

export interface PlanGenerationContext {
  userProfile: {
    name?: string;
    age?: number;
    sex?: string;
    weightKg?: number;
    heightCm?: number;
  };
  selectedGoal: {
    id: string;
    name: string;
    reason: string;
    onboardingAnswers: { question: string; answer: string }[];
  };
  onboardingAnswers: { question: string; answer: string }[];
  context_anchors: string[];
  baselineMetrics: { label: string; value: string | number; unit: string | null }[];
  desiredOutcome: string;
  constraints: string[];
  physicalConcerns: string[];
  onboardingMessages?: { role: 'user' | 'assistant'; content: string }[];
}

function baselineMetricsFromProfile(profile: any, goalId: string) {
  const metrics: PlanGenerationContext['baselineMetrics'] = [];
  const answers = profile.goalDetails?.[goalId];
  if (!answers) return metrics;

  for (const [questionId, value] of Object.entries(answers)) {
    const question = findGoalQuestion(goalId, questionId);
    if (!question || value == null) continue;
    const label = labelForGoalAnswer(question, value as string | string[]);
    if (!label) continue;
    metrics.push({
      label: question.title,
      value: label,
      unit: null,
    });
  }
  return metrics.slice(0, 12);
}

function onboardingAnswersForGoal(profile: any, goalId: string) {
  const answers = profile.goalDetails?.[goalId];
  if (!answers) return [];
  return Object.entries(answers)
    .map(([questionId, value]) => {
      const question = findGoalQuestion(goalId, questionId);
      if (!question || value == null) return null;
      const answer = labelForGoalAnswer(question, value as string | string[]);
      if (!answer) return null;
      return { question: question.title, answer };
    })
    .filter((row): row is { question: string; answer: string } => row != null);
}

function constraintsFromProfile(profile: any): string[] {
  const constraints: string[] = [];
  const concerns = (profile.physicalConcernIds ?? [])
    .filter((id: string) => id.length > 0)
    .map((id: string) =>
      id
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    );
  constraints.push(...concerns);
  if (profile.age != null && profile.age >= 65) constraints.push('Age 65+ — keep changes gentle');
  return constraints;
}

export function buildRoutineGenerationContext(profile: any): PlanGenerationContext {
  const goalId = rankGoalIds(profile.habitIds, profile.goalDetails)[0] ?? profile.habitIds?.[0] ?? 'sleep-schedule';
  const habit = habitCatalog.find((h) => h.id === goalId);
  const onboardingAnswers = onboardingAnswersForGoal(profile, goalId);

  const physicalConcerns = (profile.physicalConcernIds ?? [])
    .filter((id: string) => id.length > 0)
    .map((id: string) =>
      id
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    );

  return {
    userProfile: {
      name: profile.name,
      age: profile.age,
      sex: profile.sex ? (sexOptions.find((o) => o.id === profile.sex)?.label ?? profile.sex) : undefined,
      weightKg: profile.weightKg != null ? Math.round(profile.weightKg) : undefined,
      heightCm: profile.heightCm != null ? Math.round(profile.heightCm) : undefined,
    },
    selectedGoal: {
      id: goalId,
      name: habit?.title ?? goalId,
      reason: habit?.reason ?? '',
      onboardingAnswers,
    },
    onboardingAnswers,
    context_anchors: onboardingAnswers.map((row) => `${row.question}: ${row.answer}`),
    baselineMetrics: baselineMetricsFromProfile(profile, goalId),
    desiredOutcome: habit?.reason ?? `Improve ${habit?.title?.toLowerCase() ?? 'this area'}`,
    constraints: constraintsFromProfile(profile),
    physicalConcerns,
    onboardingMessages: profile.onboardingMessages,
  };
}

/** @deprecated alias */
export type RoutineGenerationContext = PlanGenerationContext;

const GOAL_PRIORITY = [
  'sleep-schedule',
  'screen-time',
  'hydration',
  'exercise-routine',
  'eating-habits',
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
