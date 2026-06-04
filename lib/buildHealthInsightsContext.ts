import { dataMethodOptions, habitCatalog, sexOptions } from '@/data/onboardingOptions';
import { findGoalQuestion, labelForGoalAnswer } from '@/data/onboardingGoalQuestions';
import {
  computeBmi,
  getBmiCategory,
  getBmiLabel,
  healthyWeightRangeKg,
  weightVsHealthyBand,
} from '@/lib/healthSnapshot';
import { TestResultUpload } from '@/types/health';
import { UserProfile } from '@/types/onboarding';
import { getActivePlanWeek, PersonalPlan, planDisplayTitle } from '@/types/plan';

export interface ImprovementGoal {
  area: string;
  goal: string;
  onboardingAnswers?: { question: string; answer: string }[];
}

export interface HealthInsightsContext {
  whatYouEntered: {
    age: number;
    sex: string;
    weightKg: number;
    heightCm: number;
    dataMethodsTheySelected: string[];
    personalPlan: {
      title: string;
      goalSummary: string;
      baselineSummary: string;
      primaryMetric: { label: string; unit: string | null; baselineValue: number | string | null };
      activeWeekFocus: string | null;
      activeWeekTarget: string | null;
    } | null;
  };
  wantsToImprove: ImprovementGoal[];
  optionalDerivedFromEnteredMeasurements?: {
    note: string;
    bmi: number;
    bmiLabel: string;
    weightComparedToHealthyRangeForHeight: string;
  };
}

function labelForSex(sex: UserProfile['sex']): string {
  return sexOptions.find((o) => o.id === sex)?.label ?? sex ?? 'Not specified';
}

export function improvementGoalsFromHabitIds(
  habitIds: string[],
  goalDetails?: UserProfile['goalDetails'],
): ImprovementGoal[] {
  return habitIds.map((id) => {
    const habit = habitCatalog.find((h) => h.id === id);
    const answers = goalDetails?.[id];
    const onboardingAnswers = answers
      ? Object.entries(answers)
          .map(([questionId, value]) => {
            const question = findGoalQuestion(id, questionId);
            if (!question || value == null) return null;
            const answer = labelForGoalAnswer(question, value);
            if (!answer) return null;
            return { question: question.title, answer };
          })
          .filter((row): row is { question: string; answer: string } => row != null)
      : undefined;

    return {
      area: habit?.title ?? id,
      goal: habit?.reason ?? '',
      ...(onboardingAnswers && onboardingAnswers.length > 0 ? { onboardingAnswers } : {}),
    };
  });
}

function optionalBmiContext(
  weightKg: number,
  heightCm: number,
): HealthInsightsContext['optionalDerivedFromEnteredMeasurements'] {
  const bmi = computeBmi(weightKg, heightCm);
  const category = getBmiCategory(bmi);
  const range = healthyWeightRangeKg(heightCm);
  const band = weightVsHealthyBand(weightKg, range.min, range.max);

  return {
    note: 'Computed from weight and height the user entered. Not a target or goal they set.',
    bmi: Math.round(bmi * 10) / 10,
    bmiLabel: getBmiLabel(category),
    weightComparedToHealthyRangeForHeight: band.detail,
  };
}

function labelsForDataMethods(ids: UserProfile['dataMethods']): string[] {
  return ids.map((id) => dataMethodOptions.find((m) => m.id === id)?.title ?? id);
}

export function buildHealthInsightsContext(input: {
  profile: UserProfile;
  personalPlan: PersonalPlan | null;
}): HealthInsightsContext {
  const { profile, personalPlan } = input;
  const activeWeek = personalPlan ? getActivePlanWeek(personalPlan) : null;

  const planForLlm = personalPlan
    ? {
        title: planDisplayTitle(personalPlan),
        goalSummary: personalPlan.goalSummary,
        baselineSummary: personalPlan.baselineSummary ?? '',
        primaryMetric: {
          label: personalPlan.primaryOutcome?.label || 'Progress',
          unit: personalPlan.primaryOutcome?.unit || null,
          baselineValue: personalPlan.primaryOutcome?.currentValue ?? null,
        },
        activeWeekFocus: activeWeek?.focus ?? null,
        activeWeekTarget: activeWeek?.weeklyTarget ?? null,
      }
    : null;

  return {
    whatYouEntered: {
      age: profile.age ?? 0,
      sex: labelForSex(profile.sex),
      weightKg: profile.weightKg != null ? Math.round(profile.weightKg) : 0,
      heightCm: profile.heightCm != null ? Math.round(profile.heightCm) : 0,
      dataMethodsTheySelected: labelsForDataMethods(profile.dataMethods),
      personalPlan: planForLlm,
    },
    wantsToImprove: improvementGoalsFromHabitIds(profile.habitIds, profile.goalDetails),
    ...(profile.weightKg != null && profile.heightCm != null
      ? { optionalDerivedFromEnteredMeasurements: optionalBmiContext(profile.weightKg, profile.heightCm) }
      : {}),
  };
}

export function fingerprintHealthInsightsContext(context: HealthInsightsContext): string {
  return JSON.stringify(context);
}
