import { normalizeDailyCheckInQuestion } from '@/lib/checkInQuestion';

export type CheckInAnswerType =
  | 'number'
  | 'scale_1_5'
  | 'single_choice'
  | 'multi_choice'
  | 'short_text'
  | 'time'
  | 'boolean';

export type WeekStatus = 'active' | 'provisional';



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



// ── NEW STRUCTURE FOR MULTI-PHASE DYNAMIC PLANS ──

export interface PrimaryOutcome {
  label: string;
  unit: string | null;
  currentValue: number | string | null;
  desiredValue: number | string | null;
}

export interface PlanAction {
  id: string;
  label: string;
  trigger: string | null;
  action: string;
  duration: string | null;
  required: boolean;
}

export interface PlanSignal {
  id: string;
  label: string;
  computedFromQuestionId: string;
  direction: 'higher_is_better' | 'lower_is_better' | 'stable_is_better';
}

export interface PlanReviewRule {
  reviewAfterDays: number;
  progressLooksGoodWhen: string;
  progressLooksMixedWhen: string;
  progressLooksPoorWhen: string;
}

export interface PlanPhase {
  id: string;
  status?: WeekStatus;
  title: string;
  purpose: string;
  durationDays: number;
  entryCondition: string;
  exitCondition: string;
  dailyUserWork: string;
  actions: PlanAction[];
  checkInQuestions: DailyCheckInQuestion[];
  signals: PlanSignal[];
  reviewRule: PlanReviewRule;
}

export interface NewAdaptationRule {
  id: string;
  signalId: string;
  condition: 'avg_below' | 'avg_above' | 'completion_below' | 'skipped_days_gte' | 'value_stable';
  threshold: number;
  action: 'continue' | 'simplify' | 'reduce' | 'increase' | 'change_trigger' | 'add_support' | 'repeat_phase';
  instruction: string;
}

export interface AdaptivePlan {
  id: string;
  goalId: string;
  goalName: string;
  goalSummary: string;
  reasoningSummary: string;
  horizonDays: number;
  primaryOutcome: PrimaryOutcome;
  phases: PlanPhase[];
  adaptationRules: NewAdaptationRule[];
  safetyNotes: string[];
  insights: string[];
  
  // Keep legacy fields so legacy usages don't break typing compilation
  weeks?: PlanWeek[];
  baselineSummary?: string;
  desiredOutcome?: string;
}

export type PersonalPlan = AdaptivePlan & {
  generatedAt: string;
  source: 'llm';
  activePhaseId: string;
  activeWeekNumber: number; // Keep for backward compatibility in tabs/profile, etc.
  startedAt?: string;
};

export interface PlanGenerationResult {
  plan: AdaptivePlan;
  generatedAt: string;
  source: 'llm';
}



export function planDisplayTitle(plan: Pick<AdaptivePlan, 'goalName' | 'goalSummary'>): string {
  return plan.goalName?.trim() || 'Your plan';
}

export function getActivePlanWeek(plan: PersonalPlan): PlanWeek | null {
  if (!plan.phases) return null;
  const phase = plan.phases[(plan.activeWeekNumber || 1) - 1] || plan.phases[0];
  if (!phase) return null;
  const isProvisional = phase.status === 'provisional' || ((phase.actions?.length === 0 || phase.checkInQuestions?.length === 0) && (plan.activeWeekNumber || 1) > 1);
  return {
    weekNumber: plan.activeWeekNumber ?? 1,
    status: isProvisional ? 'provisional' : 'active',
    focus: phase.title,
    weeklyTarget: phase.purpose,
    whyThisWeek: phase.purpose,
    planSteps: phase.actions.map(a => `${a.trigger ? `${a.trigger} → ` : ''}${a.action}${a.duration ? ` → ${a.duration}` : ''}`),
    planForTheWeek: phase.dailyUserWork,
    experiments: [],
    dailyCheckInQuestions: phase.checkInQuestions,
    weeklyReviewSignals: phase.signals.map(s => s.label),
  };
}

export function questionUnitLabel(question: DailyCheckInQuestion): string | null {
  return question.unit?.trim() || null;
}


export function getDaysDifference(dateStr1: string | undefined | null, dateStr2: string | undefined | null): number {
  try {
    if (!dateStr1 || !dateStr2) return 0;
    if (dateStr1.includes('NaN') || dateStr2.includes('NaN')) return 0;
    
    const clean1 = dateStr1.split('T')[0];
    const clean2 = dateStr2.split('T')[0];
    
    const d1 = new Date(clean1 + 'T00:00:00');
    const d2 = new Date(clean2 + 'T00:00:00');
    
    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return Number.isNaN(diffDays) ? 0 : diffDays;
  } catch {
    return 0;
  }
}

export function isAnswerFilled(value: any): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/** Normalize plans saved with older field names, or map weeks-based plan to phases-based. */
export function normalizeStoredPlan(plan: AdaptivePlan | (AdaptivePlan & Record<string, unknown>)): AdaptivePlan {
  const legacy = plan as Record<string, any>;

  // If already in the phases structure, return validated phases
  if (Array.isArray(legacy.phases) && legacy.phases.length > 0) {
    const phases: PlanPhase[] = legacy.phases.map((p: any, idx: number) => ({
      id: String(p.id || p.title || 'phase-1'),
      status: p.status || (idx === 0 ? 'active' : 'provisional'),
      title: String(p.title || 'Phase'),
      purpose: String(p.purpose || ''),
      durationDays: Number(p.durationDays || 7),
      entryCondition: String(p.entryCondition || ''),
      exitCondition: String(p.exitCondition || ''),
      dailyUserWork: String(p.dailyUserWork || ''),
      actions: Array.isArray(p.actions) ? p.actions.map((act: any) => ({
        id: String(act.id || ''),
        label: String(act.label || act.action || ''),
        trigger: act.trigger || null,
        action: String(act.action || act.label || ''),
        duration: act.duration || null,
        required: act.required !== false,
      })) : [],
      checkInQuestions: Array.isArray(p.checkInQuestions) ? p.checkInQuestions.map((q: any) => {
        const norm = normalizeDailyCheckInQuestion(q);
        return norm || {
          id: String(q.id),
          question: String(q.question || q.label || ''),
          answerType: String(q.answerType || q.type || 'single_choice') as any,
          required: q.required !== false,
          options: Array.isArray(q.options) ? q.options.map(String) : null,
          unit: q.unit || null,
        };
      }) : [],
      signals: Array.isArray(p.signals) ? p.signals.map((s: any) => ({
        id: String(s.id || ''),
        label: String(s.label || ''),
        computedFromQuestionId: String(s.computedFromQuestionId || ''),
        direction: String(s.direction || 'higher_is_better') as any,
      })) : [],
      reviewRule: {
        reviewAfterDays: Number(p.reviewRule?.reviewAfterDays || p.durationDays || 7),
        progressLooksGoodWhen: String(p.reviewRule?.progressLooksGoodWhen || ''),
        progressLooksMixedWhen: String(p.reviewRule?.progressLooksMixedWhen || ''),
        progressLooksPoorWhen: String(p.reviewRule?.progressLooksPoorWhen || ''),
      },
    }));

    const primaryOutcome: PrimaryOutcome = legacy.primaryOutcome ? {
      label: String(legacy.primaryOutcome.label || 'Progress'),
      unit: legacy.primaryOutcome.unit || null,
      currentValue: legacy.primaryOutcome.currentValue ?? null,
      desiredValue: legacy.primaryOutcome.desiredValue ?? null,
    } : {
      label: 'Goal Progress',
      unit: null,
      currentValue: null,
      desiredValue: null,
    };

    const adaptationRules: NewAdaptationRule[] = Array.isArray(legacy.adaptationRules) ? legacy.adaptationRules.map((r: any, rIdx: number) => ({
      id: String(r.id || `rule-${rIdx + 1}`),
      signalId: String(r.signalId || r.signal_id || ''),
      condition: String(r.condition || 'avg_below') as any,
      threshold: Number(r.threshold ?? 3),
      action: String(r.action || 'simplify') as any,
      instruction: String(r.instruction || ''),
    })) : [];

    return {
      id: String(legacy.id || 'plan-1'),
      goalId: String(legacy.goalId || legacy.goalName || 'habit-1'),
      goalName: String(legacy.goalName || 'Personal Goal'),
      goalSummary: String(legacy.goalSummary || ''),
      reasoningSummary: String(legacy.reasoningSummary || ''),
      horizonDays: Number(legacy.horizonDays || 28),
      primaryOutcome,
      phases,
      adaptationRules,
      safetyNotes: Array.isArray(legacy.safetyNotes) ? legacy.safetyNotes.map(String) : [],
      insights: Array.isArray(legacy.insights) ? legacy.insights.map(String) : [],
    };
  }

  // Otherwise, map legacy weeks plan to the new phases plan!
  const weeks = Array.isArray(legacy.weeks) ? legacy.weeks : [];
  const baseline = legacy.baseline as
    | { label?: string; value?: unknown; unit?: string | null }
    | undefined;
  const startingPoint = legacy.startingPoint as
    | { summary?: string; knownMetrics?: { label: string; value: unknown; unit: string | null }[] }
    | undefined;

  const baselineValue =
    (baseline?.value as number | string | null) ??
    (startingPoint?.knownMetrics?.[0]?.value as number | string | null) ??
    null;

  const primaryOutcome: PrimaryOutcome = {
    label: baseline?.label ?? startingPoint?.knownMetrics?.[0]?.label ?? 'Progress',
    unit: baseline?.unit ?? startingPoint?.knownMetrics?.[0]?.unit ?? null,
    currentValue: baselineValue,
    desiredValue: legacy.target?.value ?? null,
  };

  const phases: PlanPhase[] = weeks.map((w: any, idx: number) => {
    const planSteps = Array.isArray(w.planSteps)
      ? w.planSteps.filter((step: any): step is string => typeof step === 'string' && step.trim().length > 0)
      : [];

    const actions: PlanAction[] = planSteps.map((step: string, sIdx: number) => {
      let trigger: string | null = null;
      let action: string = step;
      let duration: string | null = null;
      let parts = step.split('→').map((p) => p.trim());
      if (parts.length !== 3) parts = step.split('->').map((p) => p.trim());
      if (parts.length === 3) {
        trigger = parts[0];
        action = parts[1];
        duration = parts[2];
      }
      return {
        id: `action-${idx + 1}-${sIdx + 1}`,
        label: action,
        trigger,
        action,
        duration,
        required: true,
      };
    });

    const checkInQuestions: DailyCheckInQuestion[] = Array.isArray(w.dailyCheckInQuestions)
      ? w.dailyCheckInQuestions
          .map((q: any) => normalizeDailyCheckInQuestion(q))
          .filter((item: DailyCheckInQuestion | null): item is DailyCheckInQuestion => item != null)
      : [];

    const signals: PlanSignal[] = Array.isArray(w.weeklyReviewSignals || w.endOfWeekReviewSignals || w.reviewSignals)
      ? (w.weeklyReviewSignals || w.endOfWeekReviewSignals || w.reviewSignals).map((sigName: any, sIdx: number) => {
          const qId = checkInQuestions[sIdx]?.id || checkInQuestions[0]?.id || `w${idx + 1}-observe-step`;
          return {
            id: `signal-${idx + 1}-${sIdx + 1}`,
            label: String(sigName),
            computedFromQuestionId: qId,
            direction: 'higher_is_better' as const,
          };
        })
      : [];

    return {
      id: `phase-${w.weekNumber || idx + 1}`,
      status: w.status || (idx === 0 ? 'active' : 'provisional'),
      title: `Week ${w.weekNumber || idx + 1}: ${w.focus || 'Focus'}`,
      purpose: String(w.focus || ''),
      durationDays: 7,
      entryCondition: idx === 0 ? 'Start of plan' : `Phase ${idx} complete`,
      exitCondition: `End of Week ${idx + 1}`,
      dailyUserWork: planSteps.length > 0
        ? planSteps.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n')
        : String(w.planForTheWeek || w.whyThisWeek || ''),
      actions,
      checkInQuestions,
      signals,
      reviewRule: {
        reviewAfterDays: 7,
        progressLooksGoodWhen: 'Routine consistency >= 80%',
        progressLooksMixedWhen: 'Routine consistency between 50% and 80%',
        progressLooksPoorWhen: 'Routine consistency < 50%',
      },
    };
  });

  const adaptationRules: NewAdaptationRule[] = [];
  const rulesRaw = legacy.adjustmentRules || legacy.adaptationRules;
  if (Array.isArray(rulesRaw)) {
    rulesRaw.forEach((r: any, rIdx: number) => {
      const signalId = String(r.signalId || r.signal_id || r.signal || r.when || '').trim();
      const instruction = String(r.instruction || r.nextWeekAdjustment || r.then || '').trim();
      if (signalId && instruction) {
        adaptationRules.push({
          id: `rule-${rIdx + 1}`,
          signalId,
          condition: (r.condition === 'avg_above' || r.condition === 'avg_below' || r.condition === 'skipped_days_gte') 
            ? r.condition 
            : 'avg_below',
          threshold: Number(r.threshold ?? 3),
          action: 'simplify',
          instruction: instruction.slice(0, 80),
        });
      }
    });
  }

  return {
    id: String(legacy.id || 'plan-1'),
    goalId: String(legacy.goalId || legacy.goalName || 'habit-1'),
    goalName: String(legacy.goalName || 'Personal Goal'),
    goalSummary: String(legacy.goalSummary || ''),
    reasoningSummary: 'Mapped from legacy weekly plan',
    horizonDays: phases.length * 7,
    primaryOutcome,
    phases,
    adaptationRules,
    safetyNotes: [],
    insights: [],
  };
}
