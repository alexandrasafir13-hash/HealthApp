import AsyncStorage from '@react-native-async-storage/async-storage';

import { CustomHabit } from '@/types/health';

const CUSTOM_HABITS_KEY = 'healthy:custom-habits';

type StoredCustomHabit = Omit<CustomHabit, 'completed'> & { completed?: boolean };

export async function loadCustomHabits(): Promise<CustomHabit[]> {
  const raw = await AsyncStorage.getItem(CUSTOM_HABITS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredCustomHabit[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(({ id, title, time }) => ({
      id,
      title,
      time,
      completed: false,
    }));
  } catch {
    return [];
  }
}

/** Returns habits stripped of completion flags plus any legacy completed flags for migration. */
export async function loadCustomHabitsWithLegacyCompletion(): Promise<{
  habits: CustomHabit[];
  legacyCompletedIds: string[];
}> {
  const raw = await AsyncStorage.getItem(CUSTOM_HABITS_KEY);
  if (!raw) return { habits: [], legacyCompletedIds: [] };
  try {
    const parsed = JSON.parse(raw) as StoredCustomHabit[];
    if (!Array.isArray(parsed)) return { habits: [], legacyCompletedIds: [] };
    const legacyCompletedIds = parsed.filter((h) => h.completed).map((h) => h.id);
    const habits = parsed.map(({ id, title, time }) => ({
      id,
      title,
      time,
      completed: false,
    }));
    return { habits, legacyCompletedIds };
  } catch {
    return { habits: [], legacyCompletedIds: [] };
  }
}

export async function saveCustomHabits(habits: CustomHabit[]): Promise<void> {
  const stored = habits.map(({ id, title, time }) => ({ id, title, time }));
  await AsyncStorage.setItem(CUSTOM_HABITS_KEY, JSON.stringify(stored));
}
