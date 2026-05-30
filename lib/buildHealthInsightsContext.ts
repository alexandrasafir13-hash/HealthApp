import { dataMethodOptions, habitCatalog, medicalConditionCatalog, sexOptions } from '@/data/onboardingOptions';
import { findGoalQuestion, labelForGoalAnswer } from '@/data/onboardingGoalQuestions';
import {
  computeBmi,
  getBmiCategory,
  getBmiLabel,
  healthyWeightRangeKg,
  weightVsHealthyBand,
} from '@/lib/healthSnapshot';
import { RoutineDaySummary, todayRoutineSummaryForLlm } from '@/lib/routineCompletionHistory';
import { DailyCheckIn, TestResultUpload } from '@/types/health';
import { UserProfile } from '@/types/onboarding';
import { PersonalRoutine, dailyActionsFromRoutine, overviewTipsFromRoutine, actionDoneWhen, routineDisplayTitle } from '@/types/routine';

export interface ImprovementGoal {
  area: string;
  goal: string;
  onboardingAnswers?: { question: string; answer: string }[];
}

export type LlmRoutineItem = {
  title: string;
  doneWhen: string;
  timeHint: string;
};

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
    personalRoutine: {
      title: string;
      focus: string;
      intro: string;
      overviewTips: string[];
      dailyActions: LlmRoutineItem[];
    } | null;
    todaysRoutineProgress: {
      completedCount: number;
      totalCount: number;
      completedItems: string[];
      missedItems: string[];
    } | null;
    recentRoutineDays: RoutineDaySummary[];
  };
  wantsToImprove: ImprovementGoal[];
  /** BMI from entered weight/height only — not a user goal. Omit if not useful. */
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

export function improvementAreaLabels(
  habitIds: string[],
  goalDetails?: UserProfile['goalDetails'],
): string[] {
  return improvementGoalsFromHabitIds(habitIds, goalDetails).map((g) => g.area);
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
  personalRoutine: PersonalRoutine | null;
  todayRoutineSteps: { id: string; title: string; doneWhen: string; timeHint: string; completed: boolean }[];
  uploadedDocuments: TestResultUpload[];
  recentRoutineDays: RoutineDaySummary[];
}): HealthInsightsContext {
  const { profile, personalRoutine, todayRoutineSteps, uploadedDocuments, recentRoutineDays } =
    input;

  const routineForLlm = personalRoutine
    ? {
        title: routineDisplayTitle(personalRoutine),
        focus: personalRoutine.primaryGoalTitle,
        intro: personalRoutine.intro,
        overviewTips: overviewTipsFromRoutine(personalRoutine),
        dailyActions: dailyActionsFromRoutine(personalRoutine).map((action) => ({
          title: action.title,
          doneWhen: actionDoneWhen(action),
          timeHint: action.timeHint,
        })),
      }
    : null;

  const todaysRoutineProgress =
    todayRoutineSteps.length > 0 ? todayRoutineSummaryForLlm(todayRoutineSteps) : null;

  return {
    whatYouEntered: {
      age: profile.age,
      sex: labelForSex(profile.sex),
      weightKg: Math.round(profile.weightKg),
      heightCm: Math.round(profile.heightCm),
      medicalConditions: labelsForConditions(profile.medicalConditionIds),
      dataMethodsTheySelected: labelsForDataMethods(profile.dataMethods),
      uploadedDocuments: uploadedDocumentSummaries(uploadedDocuments),
      personalRoutine: routineForLlm,
      todaysRoutineProgress,
      recentRoutineDays,
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

/** @deprecated Legacy check-in payload — kept for any remaining imports */
export function checkInPayloadForLlm(_entry: DailyCheckIn) {
  return { symptoms: [] as string[] };
}
