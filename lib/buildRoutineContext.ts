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
}

function labelsForConditions(ids: UserProfile['medicalConditionIds']): string[] {
  return ids
    .filter((id) => id !== 'none')
    .map((id) => medicalConditionCatalog.find((c) => c.id === id)?.title ?? id);
}

export interface RoutineGenerationContext {
  age: number;
  sex: string;
  weightKg: number;
  heightCm: number;
  medicalConditions: string[];
  selectedGoalIds: string[];
  wantsToImprove: ReturnType<typeof improvementGoalsFromHabitIds>;
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
  };
}
