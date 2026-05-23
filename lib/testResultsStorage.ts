import AsyncStorage from '@react-native-async-storage/async-storage';

import { TestResultUpload } from '@/types/health';

const TEST_RESULTS_KEY = 'healthy:test-results';

export async function loadTestResults(): Promise<TestResultUpload[]> {
  const raw = await AsyncStorage.getItem(TEST_RESULTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as TestResultUpload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveTestResults(results: TestResultUpload[]): Promise<void> {
  await AsyncStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(results));
}
