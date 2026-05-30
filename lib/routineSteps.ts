import { PersonalRoutine, RoutineOption, RoutineStep } from '@/types/routine';

export function routineStepId(routineId: string, index: number): string {
  return `${routineId}-step-${index}`;
}

export function ensureRoutineStepIds<T extends { id: string; steps: RoutineStep[] }>(
  routine: T,
): T {
  return {
    ...routine,
    steps: routine.steps.map((step, index) => ({
      ...step,
      id: step.id?.trim() || routineStepId(routine.id, index),
    })),
  };
}

export function withStepIds(option: RoutineOption): RoutineOption {
  return ensureRoutineStepIds(option);
}

export function normalizePersonalRoutine(routine: PersonalRoutine): PersonalRoutine {
  return ensureRoutineStepIds(routine);
}
