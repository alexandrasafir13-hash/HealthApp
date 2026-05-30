export type CheckInAnswerType =
  | 'number'
  | 'scale_1_5'
  | 'single_choice'
  | 'multi_choice'
  | 'short_text';

export type WeekStatus = 'active' | 'provisional';

export interface PlanMetric {
  label: string;
  value: number | string | null;
  unit: string | null;
}

export interface PlanStartingPoint {
  summary: string;
  knownMetrics: PlanMetric[];
  assumptions: string[];
}

export interface SuggestedExperiment {
  title: string;
  description: string;
  whenToUse: string;
}

export interface DailyCheckInQuestion {
  id: string;
  question: string;
  answerType: CheckInAnswerType;
  required: boolean;
  options: string[] | null;
  whyItMatters: string;
}

export interface PlanWeek {
  weekNumber: number;
  status: WeekStatus;
  focus: string;
  target: string;
  whyThisWeek: string;
  weeklyStrategy: string;
  suggestedExperiments: SuggestedExperiment[];
  dailyCheckInQuestions: DailyCheckInQuestion[];
  endOfWeekReviewSignals: string[];
}

export interface AdaptationRule {
  condition: string;
  adjustment: string;
}

export interface AdaptivePlan {
  id: string;
  goalId: string;
  goalName: string;
  goalSummary: string;
  startingPoint: PlanStartingPoint;
  desiredOutcome: string;
  planPrinciple: string;
  weeks: PlanWeek[];
  adaptationRules: AdaptationRule[];
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
