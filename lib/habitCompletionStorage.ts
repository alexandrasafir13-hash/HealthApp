import AsyncStorage from '@react-native-async-storage/async-storage';

const HABIT_COMPLETIONS_KEY = 'healthy:habit-completions';

/** dateKey (YYYY-MM-DD) → habitId → completed */
export type HabitCompletionLog = Record<string, Record<string, boolean>>;

export async function loadHabitCompletions(): Promise<HabitCompletionLog> {
  const raw = await AsyncStorage.getItem(HABIT_COMPLETIONS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as HabitCompletionLog;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveHabitCompletions(log: HabitCompletionLog): Promise<void> {
  await AsyncStorage.setItem(HABIT_COMPLETIONS_KEY, JSON.stringify(log));
}
