import AsyncStorage from '@react-native-async-storage/async-storage';

import { localDateKey } from '@/lib/localDate';
import { normalizeDailyCheckIn } from '@/lib/checkInPeriod';
import { DailyCheckIn } from '@/types/health';

const CHECK_IN_KEY = 'healthy:today-check-in';
const CHECK_IN_LOG_KEY = 'healthy:check-in-log';

export type CheckInLog = Record<string, DailyCheckIn>;

async function loadLegacyTodayCheckIn(): Promise<DailyCheckIn | null> {
  const raw = await AsyncStorage.getItem(CHECK_IN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DailyCheckIn;
  } catch {
    return null;
  }
}

export async function loadCheckInLog(): Promise<CheckInLog> {
  const raw = await AsyncStorage.getItem(CHECK_IN_LOG_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CheckInLog;
      if (parsed && typeof parsed === 'object') {
        const normalized: CheckInLog = {};
        for (const [date, entry] of Object.entries(parsed)) {
          normalized[date] = normalizeDailyCheckIn({ ...entry, date });
        }
        return normalized;
      }
    } catch {
      // fall through to legacy migration
    }
  }

  const legacy = await loadLegacyTodayCheckIn();
  if (legacy) {
    const log = { [legacy.date]: normalizeDailyCheckIn(legacy) };
    await saveCheckInLog(log);
    return log;
  }

  return {};
}

export async function saveCheckInLog(log: CheckInLog): Promise<void> {
  await AsyncStorage.setItem(CHECK_IN_LOG_KEY, JSON.stringify(log));
}

export async function saveCheckInLogEntry(checkIn: DailyCheckIn): Promise<void> {
  const log = await loadCheckInLog();
  log[checkIn.date] = checkIn;
  await saveCheckInLog(log);
  await saveTodayCheckIn(checkIn);
}

export async function loadTodayCheckIn(): Promise<DailyCheckIn | null> {
  const log = await loadCheckInLog();
  const today = localDateKey();
  return log[today] ?? null;
}

export async function saveTodayCheckIn(checkIn: DailyCheckIn): Promise<void> {
  await AsyncStorage.setItem(CHECK_IN_KEY, JSON.stringify(checkIn));
}
