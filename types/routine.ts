export interface RoutineStep {
  /** Stable id for daily completion tracking */
  id?: string;
  title: string;
  description: string;
  timeHint: string;
}

export interface RoutineOption {
  id: string;
  primaryGoalId: string;
  primaryGoalTitle: string;
  whyThisGoal: string;
  intro: string;
  steps: RoutineStep[];
}

export type PersonalRoutine = RoutineOption & {
  generatedAt: string;
  source: 'llm' | 'fallback';
};

export interface RoutineProposalSet {
  options: RoutineOption[];
  generatedAt: string;
  source: 'llm' | 'fallback';
}

export const ROUTINE_OPTION_COUNT = 3;
