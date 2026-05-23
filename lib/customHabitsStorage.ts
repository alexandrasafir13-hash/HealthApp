import AsyncStorage from '@react-native-async-storage/async-storage';

import { CustomHabit } from '@/types/health';

const CUSTOM_HABITS_KEY = 'healthy:custom-habits';

export async function loadCustomHabits(): Promise<CustomHabit[]> {
  const raw = await AsyncStorage.getItem(CUSTOM_HABITS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CustomHabit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCustomHabits(habits: CustomHabit[]): Promise<void> {
  await AsyncStorage.setItem(CUSTOM_HABITS_KEY, JSON.stringify(habits));
}
