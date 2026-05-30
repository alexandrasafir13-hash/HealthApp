import { localDateKey } from '@/lib/localDate';
import { DailyRoutineProgress, RoutineCompletionLog } from '@/lib/routineCompletionStorage';
import { normalizePersonalRoutine } from '@/lib/routineSteps';
import { PersonalRoutine } from '@/types/routine';

export type RoutineDaySummary = {
  date: string;
  completedCount: number;
  totalCount: number;
  completedTitles: string[];
  missedTitles: string[];
  finishedAt: string | null;
};

function summarizeDay(
  dateKey: string,
  progress: DailyRoutineProgress,
  routine: PersonalRoutine,
): RoutineDaySummary {
  const normalized = normalizePersonalRoutine(routine);
  const steps = normalized.steps.map((step, index) => ({
    id: step.id?.trim() || `${normalized.id}-step-${index}`,
    title: step.title,
  }));
  const completedTitles: string[] = [];
  const missedTitles: string[] = [];

  for (const step of steps) {
    if (progress.steps[step.id]) completedTitles.push(step.title);
    else missedTitles.push(step.title);
  }

  return {
    date: dateKey,
    completedCount: completedTitles.length,
    totalCount: steps.length,
    completedTitles,
    missedTitles,
    finishedAt: progress.finishedAt ?? null,
  };
}

export function recentRoutineDaysFromLog(
  log: RoutineCompletionLog,
  routine: PersonalRoutine | null,
  days = 14,
): RoutineDaySummary[] {
  if (!routine) return [];
  const normalized = normalizePersonalRoutine(routine);
  const results: RoutineDaySummary[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const dateKey = shiftDateKey(localDateKey(), -offset);
    const progress = log[dateKey];
    if (!progress || Object.keys(progress.steps).length === 0) continue;
    results.push(summarizeDay(dateKey, progress, normalized));
  }

  return results;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayRoutineSummaryForLlm(
  steps: { id: string; title: string; completed: boolean }[],
): {
  completedCount: number;
  totalCount: number;
  completedItems: string[];
  missedItems: string[];
} {
  const completedItems = steps.filter((s) => s.completed).map((s) => s.title);
  const missedItems = steps.filter((s) => !s.completed).map((s) => s.title);
  return {
    completedCount: completedItems.length,
    totalCount: steps.length,
    completedItems,
    missedItems,
  };
}
