import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlanCheckInAnswer = string | number | string[];

export type PlanCheckInEntry = {
  date: string;
  weekNumber: number;
  answers: Record<string, PlanCheckInAnswer>;
  submittedAt: string;
};

export type PlanCheckInLog = Record<string, PlanCheckInEntry>;

const PLAN_CHECKINS_KEY = 'healthy:plan-checkins';

export async function loadPlanCheckInLog(): Promise<PlanCheckInLog> {
  const raw = await AsyncStorage.getItem(PLAN_CHECKINS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as PlanCheckInLog;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function savePlanCheckInEntry(entry: PlanCheckInEntry): Promise<void> {
  const log = await loadPlanCheckInLog();
  log[entry.date] = entry;
  await AsyncStorage.setItem(PLAN_CHECKINS_KEY, JSON.stringify(log));
}
