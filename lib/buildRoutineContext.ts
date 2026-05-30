import { findGoalQuestion, labelForGoalAnswer } from '@/data/onboardingGoalQuestions';
import { improvementGoalsFromHabitIds } from '@/lib/buildHealthInsightsContext';
import { medicalConditionCatalog, sexOptions } from '@/data/onboardingOptions';
import { UserProfile } from '@/types/onboarding';

export interface RoutineGenerationContext {
  age: number;
  sex: string;
  weightKg: number;
  heightCm: number;
  medicalConditions: string[];
  selectedGoalIds: string[];
  wantsToImprove: ReturnType<typeof improvementGoalsFromHabitIds>;
  baselineMetrics: { label: string; value: string | number; unit: string | null }[];
  userPreferences: string[];
  constraints: string[];
}

function labelsForConditions(ids: UserProfile['medicalConditionIds']): string[] {
  return ids
    .filter((id) => id !== 'none')
    .map((id) => medicalConditionCatalog.find((c) => c.id === id)?.title ?? id);
}

function baselineMetricsFromProfile(profile: UserProfile) {
  const metrics: RoutineGenerationContext['baselineMetrics'] = [];
  for (const habitId of profile.habitIds) {
    const answers = profile.goalDetails?.[habitId];
    if (!answers) continue;
    for (const [questionId, value] of Object.entries(answers)) {
      const question = findGoalQuestion(habitId, questionId);
      if (!question || value == null) continue;
      const label = labelForGoalAnswer(question, value);
      if (!label) continue;
      metrics.push({
        label: question.title,
        value: label,
        unit: null,
      });
    }
  }
  return metrics.slice(0, 12);
}

function userPreferencesFromProfile(profile: UserProfile): string[] {
  const prefs: string[] = [];
  if (profile.dataMethods.includes('apple-health')) prefs.push('Uses Apple Health');
  if (profile.dataMethods.includes('google-health')) prefs.push('Uses Google Health Connect');
  if (profile.dataMethods.includes('upload')) prefs.push('Uploads health documents');
  for (const goal of improvementGoalsFromHabitIds(profile.habitIds, profile.goalDetails)) {
    if (goal.onboardingAnswers?.length) {
      prefs.push(...goal.onboardingAnswers.map((row) => `${row.question}: ${row.answer}`));
    }
  }
  return prefs.slice(0, 10);
}

function constraintsFromProfile(profile: UserProfile): string[] {
  const constraints = labelsForConditions(profile.medicalConditionIds);
  if (profile.age >= 65) constraints.push('Age 65+ — keep changes gentle');
  return constraints;
}

export function buildRoutineGenerationContext(profile: UserProfile): RoutineGenerationContext {
  return {
    age: profile.age,
    sex: sexOptions.find((o) => o.id === profile.sex)?.label ?? profile.sex,
    weightKg: Math.round(profile.weightKg),
    heightCm: Math.round(profile.heightCm),
    medicalConditions: labelsForConditions(profile.medicalConditionIds),
    selectedGoalIds: profile.habitIds,
    wantsToImprove: improvementGoalsFromHabitIds(profile.habitIds, profile.goalDetails),
    baselineMetrics: baselineMetricsFromProfile(profile),
    userPreferences: userPreferencesFromProfile(profile),
    constraints: constraintsFromProfile(profile),
  };
}
