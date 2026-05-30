import { dataMethodOptions, habitCatalog, medicalConditionCatalog, sexOptions } from '@/data/onboardingOptions';
import { findGoalQuestion, labelForGoalAnswer } from '@/data/onboardingGoalQuestions';
import {
  computeBmi,
  getBmiCategory,
  getBmiLabel,
  healthyWeightRangeKg,
  weightVsHealthyBand,
} from '@/lib/healthSnapshot';
import { PlanCheckInEntry } from '@/lib/planCheckInStorage';
import { DailyCheckIn, TestResultUpload } from '@/types/health';
import { UserProfile } from '@/types/onboarding';
import { getActivePlanWeek, PersonalPlan, planDisplayTitle } from '@/types/plan';

export interface ImprovementGoal {
  area: string;
  goal: string;
  onboardingAnswers?: { question: string; answer: string }[];
}

/** Only data the user actually entered or chose — sent to the LLM for tips. */
export interface HealthInsightsContext {
  whatYouEntered: {
    age: number;
    sex: string;
    weightKg: number;
    heightCm: number;
    medicalConditions: string[];
    dataMethodsTheySelected: string[];
    uploadedDocuments: { name: string; kind: string; uploadedAt: string }[];
    personalPlan: {
      title: string;
      goalSummary: string;
      baselineSummary: string;
      primaryMetric: { label: string; unit: string | null; baselineValue: number | string | null };
      activeWeekFocus: string | null;
      activeWeekTarget: string | null;
    } | null;
    todaysPlanCheckIn: {
      weekNumber: number;
      answers: Record<string, string | number | string[]>;
      submittedAt: string;
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
  return sexOptions.find((o) => o.id === sex)?.label ?? sex;
}

function labelsForConditions(ids: UserProfile['medicalConditionIds']): string[] {
  return ids
    .filter((id) => id !== 'none')
    .map((id) => medicalConditionCatalog.find((c) => c.id === id)?.title ?? id);
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

function uploadedDocumentSummaries(uploads: TestResultUpload[]) {
  return uploads.map((doc) => ({
    name: doc.name,
    kind: doc.kind,
    uploadedAt: doc.uploadedAt,
  }));
}

export function buildHealthInsightsContext(input: {
  profile: UserProfile;
  personalPlan: PersonalPlan | null;
  todayPlanCheckIn: PlanCheckInEntry | null;
  uploadedDocuments: TestResultUpload[];
}): HealthInsightsContext {
  const { profile, personalPlan, todayPlanCheckIn, uploadedDocuments } = input;
  const activeWeek = personalPlan ? getActivePlanWeek(personalPlan) : null;

  const planForLlm = personalPlan
    ? {
        title: planDisplayTitle(personalPlan),
        goalSummary: personalPlan.goalSummary,
        baselineSummary: personalPlan.baselineSummary,
        primaryMetric: personalPlan.primaryMetric,
        activeWeekFocus: activeWeek?.focus ?? null,
        activeWeekTarget: activeWeek?.weeklyTarget ?? null,
      }
    : null;

  const todaysPlanCheckIn = todayPlanCheckIn
    ? {
        weekNumber: todayPlanCheckIn.weekNumber,
        answers: todayPlanCheckIn.answers,
        submittedAt: todayPlanCheckIn.submittedAt,
      }
    : null;

  return {
    whatYouEntered: {
      age: profile.age,
      sex: labelForSex(profile.sex),
      weightKg: Math.round(profile.weightKg),
      heightCm: Math.round(profile.heightCm),
      medicalConditions: labelsForConditions(profile.medicalConditionIds),
      dataMethodsTheySelected: labelsForDataMethods(profile.dataMethods),
      uploadedDocuments: uploadedDocumentSummaries(uploadedDocuments),
      personalPlan: planForLlm,
      todaysPlanCheckIn,
    },
    wantsToImprove: improvementGoalsFromHabitIds(profile.habitIds, profile.goalDetails),
    optionalDerivedFromEnteredMeasurements: optionalBmiContext(
      profile.weightKg,
      profile.heightCm,
    ),
  };
}

export function fingerprintHealthInsightsContext(context: HealthInsightsContext): string {
  return JSON.stringify(context);
}

/** @deprecated Legacy check-in payload */
export function checkInPayloadForLlm(_entry: DailyCheckIn) {
  return { symptoms: [] as string[] };
}
