import { CheckInLog } from '@/lib/checkInStorage';
import { localDateKey } from '@/lib/localDate';
import {
  CHECK_IN_PERIODS,
  CheckInPeriod,
  normalizeDailyCheckIn,
  periodFeeling,
} from '@/lib/checkInPeriod';
import { DailyCheckIn } from '@/types/health';

export interface PeriodCheckInRecord {
  date: string;
  period: CheckInPeriod;
  feeling: string;
  symptoms: string[];
  submittedAt: string;
}

export function periodCheckInRecordsFromEntry(entry: DailyCheckIn): PeriodCheckInRecord[] {
  const normalized = normalizeDailyCheckIn(entry);
  const records: PeriodCheckInRecord[] = [];

  for (const period of CHECK_IN_PERIODS) {
    const feeling = periodFeeling(normalized, period);
    const data = normalized.periods?.[period];
    if (!feeling || !data) continue;
    records.push({
      date: normalized.date,
      period,
      feeling,
      symptoms: data.symptoms,
      submittedAt: data.submittedAt,
    });
  }

  return records;
}

export function periodCheckInHistoryFromLog(
  log: CheckInLog,
  days = 14,
  throughDateKey = localDateKey(),
): PeriodCheckInRecord[] {
  const end = new Date(`${throughDateKey}T12:00:00`);
  const dateKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dateKeys.push(localDateKey(d));
  }

  return dateKeys
    .flatMap((date) => {
      const entry = log[date];
      if (!entry) return [];
      return periodCheckInRecordsFromEntry(entry);
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}
