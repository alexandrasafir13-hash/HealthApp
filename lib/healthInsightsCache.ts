import AsyncStorage from '@react-native-async-storage/async-storage';

import { HealthInsightsCacheEntry } from '@/types/healthInsights';

const CACHE_KEY = 'healthy:llm-health-insights';

export async function loadHealthInsightsCache(): Promise<HealthInsightsCacheEntry | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HealthInsightsCacheEntry;
  } catch {
    return null;
  }
}

export async function saveHealthInsightsCache(entry: HealthInsightsCacheEntry): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}
