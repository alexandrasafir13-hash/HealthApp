import { PersonalRoutine, RoutineOption, RoutineDailyAction } from '@/types/routine';

export function routineActionId(routineId: string, index: number): string {
  return `${routineId}-action-${index}`;
}

export function ensureRoutineActionIds<T extends { id: string; dailyActions: RoutineDailyAction[] }>(
  routine: T,
): T {
  return {
    ...routine,
    dailyActions: routine.dailyActions.map((action, index) => ({
      ...action,
      id: action.id?.trim() || routineActionId(routine.id, index),
    })),
  };
}

export function withActionIds(option: RoutineOption): RoutineOption {
  return ensureRoutineActionIds(option);
}

export function normalizePersonalRoutine(routine: PersonalRoutine): PersonalRoutine {
  return ensureRoutineActionIds(routine);
}
