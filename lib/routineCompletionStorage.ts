import AsyncStorage from '@react-native-async-storage/async-storage';

const ROUTINE_COMPLETIONS_KEY = 'healthy:routine-completions';

/** dateKey (YYYY-MM-DD) → daily routine progress */
export type RoutineCompletionLog = Record<string, DailyRoutineProgress>;

export type DailyRoutineProgress = {
  /** stepId → completed */
  steps: Record<string, boolean>;
  /** Set when the user finishes today's routine and views insights */
  finishedAt?: string;
};

export async function loadRoutineCompletionLog(): Promise<RoutineCompletionLog> {
  const raw = await AsyncStorage.getItem(ROUTINE_COMPLETIONS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as RoutineCompletionLog;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveRoutineCompletionLog(log: RoutineCompletionLog): Promise<void> {
  await AsyncStorage.setItem(ROUTINE_COMPLETIONS_KEY, JSON.stringify(log));
}
