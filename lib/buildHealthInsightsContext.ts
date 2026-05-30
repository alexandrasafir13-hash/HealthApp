import { dataMethodOptions, habitCatalog, medicalConditionCatalog, sexOptions } from '@/data/onboardingOptions';
import {
  computeBmi,
  getBmiCategory,
  getBmiLabel,
  healthyWeightRangeKg,
  weightVsHealthyBand,
} from '@/lib/healthSnapshot';
import { DailyCheckIn, TestResultUpload } from '@/types/health';
import { UserProfile } from '@/types/onboarding';

export interface ImprovementGoal {
  area: string;
  goal: string;
}

/** Only data the user actually entered or chose — sent to the LLM for tips. */
export interface HealthInsightsContext {
  whatYouEntered: {
    age: number;
    sex: string;
    weightKg: number;
    heightCm: number;
    medicalConditions: string[];
    checkIn: {
      energy: number;
      sleepQuality: number;
      stress: number;
      symptoms: string[];
    } | null;
    routineCompletedToday: number;
    routineTotalToday: number;
    todaysBodyFeeling: string | null;
    dataMethodsTheySelected: string[];
    uploadedDocuments: { name: string; kind: string; uploadedAt: string }[];
    recentDailyCheckIns: {
      date: string;
      energy: number;
      sleepQuality: number;
      stress: number;
      symptoms: string[];
    }[];
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

export function improvementGoalsFromHabitIds(habitIds: string[]): ImprovementGoal[] {
  return habitIds.map((id) => {
    const habit = habitCatalog.find((h) => h.id === id);
    return {
      area: habit?.title ?? id,
      goal: habit?.reason ?? '',
    };
  });
}

export function improvementAreaLabels(habitIds: string[]): string[] {
  return improvementGoalsFromHabitIds(habitIds).map((g) => g.area);
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
  todayCheckIn: DailyCheckIn | null;
  routineCompleted: number;
  routineTotal: number;
  todayFeelingLabel: string | null;
  uploadedDocuments: TestResultUpload[];
  recentCheckIns: Pick<
    DailyCheckIn,
    'date' | 'energy' | 'sleepQuality' | 'stress' | 'symptoms'
  >[];
}): HealthInsightsContext {
  const {
    profile,
    todayCheckIn,
    routineCompleted,
    routineTotal,
    todayFeelingLabel,
    uploadedDocuments,
    recentCheckIns,
  } = input;

  return {
    whatYouEntered: {
      age: profile.age,
      sex: labelForSex(profile.sex),
      weightKg: Math.round(profile.weightKg),
      heightCm: Math.round(profile.heightCm),
      medicalConditions: labelsForConditions(profile.medicalConditionIds),
      checkIn: todayCheckIn
        ? {
            energy: todayCheckIn.energy,
            sleepQuality: todayCheckIn.sleepQuality,
            stress: todayCheckIn.stress,
            symptoms: todayCheckIn.symptoms,
          }
        : null,
      routineCompletedToday: routineCompleted,
      routineTotalToday: routineTotal,
      todaysBodyFeeling: todayFeelingLabel,
      dataMethodsTheySelected: labelsForDataMethods(profile.dataMethods),
      uploadedDocuments: uploadedDocumentSummaries(uploadedDocuments),
      recentDailyCheckIns: recentCheckIns,
    },
    wantsToImprove: improvementGoalsFromHabitIds(profile.habitIds),
    optionalDerivedFromEnteredMeasurements: optionalBmiContext(
      profile.weightKg,
      profile.heightCm,
    ),
  };
}

export function fingerprintHealthInsightsContext(context: HealthInsightsContext): string {
  return JSON.stringify(context);
}
