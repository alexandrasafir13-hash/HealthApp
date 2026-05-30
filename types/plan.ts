import { normalizeDailyCheckInQuestion } from '@/lib/checkInQuestion';

export type CheckInAnswerType =
  | 'number'
  | 'scale_1_5'
  | 'single_choice'
  | 'multi_choice'
  | 'short_text'
  | 'time';

export type WeekStatus = 'active' | 'provisional';

export interface PrimaryMetric {
  label: string;
  unit: string | null;
  baselineValue: number | string | null;
}

export interface PlanExperiment {
  title: string;
  description: string;
  whatItTests: string;
}

export interface DailyCheckInQuestion {
  id: string;
  question: string;
  answerType: CheckInAnswerType;
  required: boolean;
  options: string[] | null;
  unit: string | null;
}

export interface PlanWeek {
  weekNumber: number;
  status: WeekStatus;
  focus: string;
  weeklyTarget: string;
  planForTheWeek: string;
  experiments: PlanExperiment[];
  dailyCheckInQuestions: DailyCheckInQuestion[];
  weeklyReviewSignals: string[];
}

export interface AdjustmentRule {
  signal: string;
  nextWeekAdjustment: string;
}

export interface AdaptivePlan {
  id: string;
  goalId: string;
  goalName: string;
  goalSummary: string;
  baselineSummary: string;
  desiredOutcome: string;
  primaryMetric: PrimaryMetric;
  weeks: PlanWeek[];
  adjustmentRules: AdjustmentRule[];
}

export type PersonalPlan = AdaptivePlan & {
  generatedAt: string;
  source: 'llm' | 'fallback';
  activeWeekNumber: number;
};

export interface PlanGenerationResult {
  plan: AdaptivePlan;
  generatedAt: string;
  source: 'llm' | 'fallback';
}

export const PLAN_WEEK_COUNT = 4;

export function planDisplayTitle(plan: Pick<AdaptivePlan, 'goalName' | 'goalSummary'>): string {
  return plan.goalName?.trim() || 'Your plan';
}

export function getPlanWeek(plan: AdaptivePlan, weekNumber: number): PlanWeek | null {
  return plan.weeks.find((week) => week.weekNumber === weekNumber) ?? null;
}

export function getActivePlanWeek(plan: PersonalPlan): PlanWeek | null {
  return getPlanWeek(plan, plan.activeWeekNumber);
}

export function questionUnitLabel(question: DailyCheckInQuestion): string | null {
  return question.unit?.trim() || null;
}

/** Normalize plans saved with older field names. */
export function normalizeStoredPlan(plan: AdaptivePlan | (AdaptivePlan & Record<string, unknown>)): AdaptivePlan {
  const legacy = plan as Record<string, unknown>;
  const startingPoint = legacy.startingPoint as
    | { summary?: string; knownMetrics?: { label: string; value: unknown; unit: string | null }[] }
    | undefined;

  const baselineSummary =
    plan.baselineSummary?.trim() ||
    String(startingPoint?.summary ?? '').trim() ||
    plan.goalSummary;

  const primaryMetric =
    plan.primaryMetric?.label != null
      ? plan.primaryMetric
      : {
          label: startingPoint?.knownMetrics?.[0]?.label ?? 'Progress',
          unit: startingPoint?.knownMetrics?.[0]?.unit ?? null,
          baselineValue:
            (startingPoint?.knownMetrics?.[0]?.value as number | string | null) ?? null,
        };

  const weeks = (plan.weeks ?? []).map((week) => {
    const w = week as PlanWeek & Record<string, unknown>;
    return {
      weekNumber: w.weekNumber,
      status: w.status,
      focus: w.focus,
      weeklyTarget: w.weeklyTarget || String(w.target ?? w.likelyTarget ?? ''),
      planForTheWeek: (() => {
        const preview =
          w.planForTheWeek || String(w.weeklyStrategy ?? w.whyThisWeek ?? w.preview ?? '');
        const dependsOn = String(w.dependsOn ?? '').trim();
        return preview && dependsOn ? `${preview} ${dependsOn}` : preview || dependsOn;
      })(),
      experiments: (w.experiments ?? w.suggestedExperiments ?? []).map((exp) => {
        const e = exp as PlanExperiment & { whenToUse?: string };
        return {
          title: e.title,
          description: e.description,
          whatItTests: e.whatItTests || e.whenToUse || '',
        };
      }),
      dailyCheckInQuestions: (w.dailyCheckInQuestions ?? [])
        .map((q) => normalizeDailyCheckInQuestion(q))
        .filter((item): item is DailyCheckInQuestion => item != null),
      weeklyReviewSignals: w.weeklyReviewSignals ?? w.endOfWeekReviewSignals ?? [],
    };
  });

  const adjustmentRules = (plan.adjustmentRules ?? []).length
    ? plan.adjustmentRules
    : ((legacy.adaptationRules as AdjustmentRule[] | undefined) ?? []).map((rule) => {
        const r = rule as AdjustmentRule & { condition?: string; adjustment?: string };
        return {
          signal: r.signal || r.condition || '',
          nextWeekAdjustment: r.nextWeekAdjustment || r.adjustment || '',
        };
      });

  return {
    id: plan.id,
    goalId: plan.goalId,
    goalName: plan.goalName,
    goalSummary: plan.goalSummary,
    baselineSummary,
    desiredOutcome: plan.desiredOutcome,
    primaryMetric,
    weeks,
    adjustmentRules,
  };
}
