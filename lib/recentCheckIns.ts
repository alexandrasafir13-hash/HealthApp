import { CheckInLog } from '@/lib/checkInStorage';
import { normalizeDailyCheckIn } from '@/lib/checkInPeriod';
import { localDateKey } from '@/lib/localDate';
import { DailyCheckIn } from '@/types/health';

export function recentCheckInsFromLog(
  log: CheckInLog,
  days = 7,
  throughDateKey = localDateKey(),
): DailyCheckIn[] {
  const keys: string[] = [];
  const end = new Date(`${throughDateKey}T12:00:00`);
  for (let i = 0; i < days; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    keys.push(localDateKey(d));
  }
  return keys
    .map((date) => log[date])
    .filter((entry): entry is DailyCheckIn => entry != null)
    .map((entry) => normalizeDailyCheckIn({ ...entry, date: entry.date }));
}
