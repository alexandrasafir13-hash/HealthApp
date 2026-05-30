import { findGoalQuestion, labelForGoalAnswer } from '@/data/onboardingGoalQuestions';
import { improvementGoalsFromHabitIds } from '@/lib/buildHealthInsightsContext';
import { habitCatalog, medicalConditionCatalog, sexOptions } from '@/data/onboardingOptions';
import { rankGoalIds } from '@/lib/fallbackRoutine';
import { UserProfile } from '@/types/onboarding';

export interface PlanGenerationContext {
  userProfile: {
    name: string;
    age: number;
    sex: string;
    weightKg: number;
    heightCm: number;
  };
  selectedGoal: {
    id: string;
    name: string;
    reason: string;
    onboardingAnswers: { question: string; answer: string }[];
  };
  onboardingAnswers: { question: string; answer: string }[];
  baselineMetrics: { label: string; value: string | number; unit: string | null }[];
  desiredOutcome: string;
  constraints: string[];
  medicalConditions: string[];
}

function labelsForConditions(ids: UserProfile['medicalConditionIds']): string[] {
  return ids
    .filter((id) => id !== 'none')
    .map((id) => medicalConditionCatalog.find((c) => c.id === id)?.title ?? id);
}

function baselineMetricsFromProfile(profile: UserProfile, goalId: string) {
  const metrics: PlanGenerationContext['baselineMetrics'] = [];
  const answers = profile.goalDetails?.[goalId];
  if (!answers) return metrics;

  for (const [questionId, value] of Object.entries(answers)) {
    const question = findGoalQuestion(goalId, questionId);
    if (!question || value == null) continue;
    const label = labelForGoalAnswer(question, value);
    if (!label) continue;
    metrics.push({
      label: question.title,
      value: label,
      unit: null,
    });
  }
  return metrics.slice(0, 12);
}

function onboardingAnswersForGoal(profile: UserProfile, goalId: string) {
  const answers = profile.goalDetails?.[goalId];
  if (!answers) return [];
  return Object.entries(answers)
    .map(([questionId, value]) => {
      const question = findGoalQuestion(goalId, questionId);
      if (!question || value == null) return null;
      const answer = labelForGoalAnswer(question, value);
      if (!answer) return null;
      return { question: question.title, answer };
    })
    .filter((row): row is { question: string; answer: string } => row != null);
}

function constraintsFromProfile(profile: UserProfile): string[] {
  const constraints = labelsForConditions(profile.medicalConditionIds);
  if (profile.age >= 65) constraints.push('Age 65+ — keep changes gentle');
  if (profile.dataMethods.includes('upload')) constraints.push('User may reference uploaded health documents');
  return constraints;
}

export function buildRoutineGenerationContext(profile: UserProfile): PlanGenerationContext {
  const goalId = rankGoalIds(profile.habitIds, profile.goalDetails)[0] ?? profile.habitIds[0] ?? 'sleep-schedule';
  const habit = habitCatalog.find((h) => h.id === goalId);
  const onboardingAnswers = onboardingAnswersForGoal(profile, goalId);

  return {
    userProfile: {
      name: profile.name,
      age: profile.age,
      sex: sexOptions.find((o) => o.id === profile.sex)?.label ?? profile.sex,
      weightKg: Math.round(profile.weightKg),
      heightCm: Math.round(profile.heightCm),
    },
    selectedGoal: {
      id: goalId,
      name: habit?.title ?? goalId,
      reason: habit?.reason ?? '',
      onboardingAnswers,
    },
    onboardingAnswers,
    baselineMetrics: baselineMetricsFromProfile(profile, goalId),
    desiredOutcome: habit?.reason ?? `Improve ${habit?.title?.toLowerCase() ?? 'this area'}`,
    constraints: constraintsFromProfile(profile),
    medicalConditions: labelsForConditions(profile.medicalConditionIds),
  };
}

/** @deprecated alias */
export type RoutineGenerationContext = PlanGenerationContext;
