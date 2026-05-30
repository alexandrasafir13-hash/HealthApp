export interface RoutineDailyAction {
  /** Stable id for daily completion tracking */
  id?: string;
  /** Short imperative label for the checkbox — what the user did */
  title: string;
  /** One sentence: how they know this item is done today */
  doneWhen: string;
  timeHint: string;
}

/** @deprecated Use RoutineDailyAction */
export type RoutineStep = RoutineDailyAction & {
  description?: string;
};

export interface RoutineOption {
  id: string;
  /** Short friendly routine name from the LLM (max ~5 words) */
  title: string;
  primaryGoalId: string;
  primaryGoalTitle: string;
  /** Why this focus area helps — overview only, not tickable */
  whyThisGoal: string;
  /** Short routine summary — overview only, not tickable */
  intro: string;
  /** 2–4 advice bullets — overview only, NOT the daily checklist */
  overviewTips: string[];
  /** 3–5 binary tasks the user ticks off every day */
  dailyActions: RoutineDailyAction[];
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

export function actionDoneWhen(action: RoutineDailyAction): string {
  return action.doneWhen.trim() || (action as RoutineStep).description?.trim() || '';
}

export function normalizeDailyAction(raw: RoutineDailyAction | RoutineStep): RoutineDailyAction {
  const doneWhen = actionDoneWhen(raw as RoutineDailyAction);
  return {
    ...(raw.id ? { id: raw.id } : {}),
    title: raw.title.trim(),
    doneWhen,
    timeHint: raw.timeHint.trim(),
  };
}

/** Accept saved routines that still use `steps` + `description`. */
export function dailyActionsFromRoutine(
  routine: Pick<RoutineOption, 'dailyActions'> & { steps?: RoutineStep[] },
): RoutineDailyAction[] {
  const actions = routine.dailyActions?.length
    ? routine.dailyActions
    : (routine.steps ?? []).map((step) => normalizeDailyAction(step));
  return actions.map(normalizeDailyAction);
}

export function overviewTipsFromRoutine(
  routine: Pick<RoutineOption, 'overviewTips' | 'intro'>,
): string[] {
  if (routine.overviewTips?.length) return routine.overviewTips;
  return [];
}

export function routineDisplayTitle(
  routine: Pick<RoutineOption, 'title' | 'primaryGoalTitle'>,
): string {
  return routine.title?.trim() || routine.primaryGoalTitle;
}
