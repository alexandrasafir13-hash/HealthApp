import { normalizeDailyCheckInQuestion } from '@/lib/checkInQuestion';

export type CheckInAnswerType =
  | 'number'
  | 'scale_1_5'
  | 'single_choice'
  | 'multi_choice'
  | 'short_text'
  | 'time';

export type WeekStatus = 'active' | 'provisional';

export type AdjustmentCondition = 'avg_below' | 'avg_above' | 'skipped_days_gte';

export type AdjustmentAction =
  | 'reduce_duration'
  | 'shift_cue'
  | 'simplify_action'
  | 'increase_duration'
  | 'add_reminder';

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
  whyThisWeek: string | null;
  planSteps: string[];
  planForTheWeek: string;
  experiments: PlanExperiment[];
  dailyCheckInQuestions: DailyCheckInQuestion[];
  weeklyReviewSignals: string[];
}

export interface AdjustmentRule {
  signalId: string;
  condition: AdjustmentCondition;
  threshold: number;
  adjustment: AdjustmentAction;
  instruction: string;
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

function formatMetricSummary(
  prefix: string,
  raw: { label?: string; value?: unknown; unit?: string | null } | null | undefined,
): string {
  if (!raw?.label?.trim()) return '';
  const valueText = raw.value == null ? 'not set yet' : String(raw.value);
  const unit = raw.unit?.trim();
  return `${prefix}: ${raw.label.trim()} — ${valueText}${unit ? ` ${unit}` : ''}`;
}

/** Normalize plans saved with older field names. */
export function normalizeStoredPlan(plan: AdaptivePlan | (AdaptivePlan & Record<string, unknown>)): AdaptivePlan {
  const legacy = plan as Record<string, unknown>;
  const startingPoint = legacy.startingPoint as
    | { summary?: string; knownMetrics?: { label: string; value: unknown; unit: string | null }[] }
    | undefined;
  const baseline = legacy.baseline as
    | { label?: string; value?: unknown; unit?: string | null }
    | undefined;
  const target = legacy.target as
    | { label?: string; value?: unknown; unit?: string | null }
    | undefined;

  const baselineSummary =
    plan.baselineSummary?.trim() ||
    formatMetricSummary('Baseline', baseline) ||
    String(startingPoint?.summary ?? '').trim() ||
    plan.goalSummary;

  const desiredOutcome =
    plan.desiredOutcome?.trim() ||
    formatMetricSummary('Target', target) ||
    plan.goalSummary;

  const primaryMetric =
    plan.primaryMetric?.label != null
      ? plan.primaryMetric
      : {
          label: baseline?.label ?? startingPoint?.knownMetrics?.[0]?.label ?? 'Progress',
          unit: baseline?.unit ?? startingPoint?.knownMetrics?.[0]?.unit ?? null,
          baselineValue:
            (baseline?.value as number | string | null) ??
            (startingPoint?.knownMetrics?.[0]?.value as number | string | null) ??
            null,
        };

  const weeks = (plan.weeks ?? []).map((week) => {
    const w = week as PlanWeek & Record<string, unknown>;
    const planSteps = Array.isArray(w.planSteps)
      ? w.planSteps.filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
      : [];
    const whyThisWeek = String(w.whyThisWeek ?? '').trim() || null;
    const preview =
      w.planForTheWeek || String(w.weeklyStrategy ?? w.whyThisWeek ?? w.preview ?? '');
    const dependsOn = String(w.dependsOn ?? '').trim();
    const mergedPreview = preview && dependsOn ? `${preview} ${dependsOn}` : preview || dependsOn;
    const planForTheWeek =
      planSteps.length > 0
        ? planSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')
        : mergedPreview;

    return {
      weekNumber: w.weekNumber,
      status: w.status,
      focus: w.focus,
      weeklyTarget: w.weeklyTarget || String(w.target ?? w.likelyTarget ?? ''),
      whyThisWeek,
      planSteps,
      planForTheWeek,
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
      weeklyReviewSignals:
        w.weeklyReviewSignals ?? w.endOfWeekReviewSignals ?? w.reviewSignals ?? [],
    };
  });

  const adjustmentRules = (plan.adjustmentRules ?? []).length
    ? plan.adjustmentRules.map((rule) => {
        const r = rule as AdjustmentRule & {
          signal?: string;
          nextWeekAdjustment?: string;
          signal_id?: string;
        };
        if (r.signalId && r.instruction) return rule;
        const signalId = String(r.signal_id ?? r.signalId ?? r.signal ?? '').trim();
        const instruction = String(r.instruction ?? r.nextWeekAdjustment ?? '').trim();
        return {
          signalId,
          condition: r.condition ?? 'avg_below',
          threshold: r.threshold ?? 3,
          adjustment: r.adjustment ?? 'simplify_action',
          instruction,
        } as AdjustmentRule;
      })
    : ((legacy.adaptationRules as Record<string, unknown>[] | undefined) ?? [])
        .map((rule) => {
          const when = String(rule.when ?? rule.signal ?? rule.condition ?? '').trim();
          const then = String(rule.then ?? rule.instruction ?? rule.nextWeekAdjustment ?? rule.adjustment ?? '').trim();
          if (!when || !then) return null;
          return {
            signalId: when,
            condition: 'avg_below' as const,
            threshold: 3,
            adjustment: 'simplify_action' as const,
            instruction: then.slice(0, 80),
          };
        })
        .filter((item): item is AdjustmentRule => item != null);

  return {
    id: plan.id,
    goalId: plan.goalId,
    goalName: plan.goalName,
    goalSummary: plan.goalSummary,
    baselineSummary,
    desiredOutcome,
    primaryMetric,
    weeks,
    adjustmentRules,
  };
}
