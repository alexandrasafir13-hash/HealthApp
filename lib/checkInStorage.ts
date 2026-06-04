import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyCheckIn } from '@/types/health';

const CHECK_IN_LOG_KEY = 'healthee:check-in-log';

export type CheckInLog = Record<string, DailyCheckIn>;

export async function loadCheckInLog(): Promise<CheckInLog> {
  const raw = await AsyncStorage.getItem(CHECK_IN_LOG_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as CheckInLog;
    } catch {
      // ignore
    }
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
}
