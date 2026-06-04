export interface RoutineDailyAction {
  id?: string;
  title: string;
  doneWhen: string;
  timeHint: string;
}

export type RoutineStep = RoutineDailyAction & {
  description?: string;
};

export interface RoutineOption {
  id: string;
  title: string;
  primaryGoalId: string;
  primaryGoalTitle: string;
  whyThisGoal: string;
  intro: string;
  overviewTips: string[];
  dailyActions: RoutineDailyAction[];
}

export type PersonalRoutine = RoutineOption & {
  generatedAt: string;
  source: 'llm';
};

export interface RoutineProposalSet {
  options: RoutineOption[];
  generatedAt: string;
  source: 'llm';
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
