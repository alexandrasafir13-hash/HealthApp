import { feelingLabelForValue, feelingValueForLabel } from '@/lib/feelingScale';
import { localDateKey } from '@/lib/localDate';
import type { DailyCheckIn, PeriodCheckIn } from '@/types/health';

export type CheckInPeriod = 'morning' | 'afternoon' | 'evening';

export const CHECK_IN_PERIODS: CheckInPeriod[] = ['morning', 'afternoon', 'evening'];

/** Local-time windows: morning 5–11, afternoon 12–16, evening 17–4. */
export function getCurrentCheckInPeriod(date = new Date()): CheckInPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

export function checkInPromptForPeriod(period: CheckInPeriod): string {
  switch (period) {
    case 'morning':
      return 'How did you sleep last night?';
    case 'afternoon':
      return 'How is your energy this afternoon?';
    case 'evening':
      return 'How do you feel this evening?';
  }
}

export function checkInPeriodLabel(period: CheckInPeriod): string {
  switch (period) {
    case 'morning':
      return 'Morning';
    case 'afternoon':
      return 'Afternoon';
    case 'evening':
      return 'Evening';
  }
}

type PeriodData = Partial<PeriodCheckIn> & { energy?: number };

/** Saved feeling label for a period, e.g. "Drained". */
export function periodFeeling(
  entry: { periods?: Partial<Record<CheckInPeriod, PeriodData>>; energy?: number } | null | undefined,
  period: CheckInPeriod,
): string | undefined {
  const data = entry?.periods?.[period];
  if (data?.feeling) return data.feeling;
  if (data?.energy != null) return feelingLabelForValue(data.energy) ?? undefined;
  if (period === 'morning' && entry?.periods == null && entry?.energy != null) {
    return feelingLabelForValue(entry.energy) ?? undefined;
  }
  return undefined;
}

/** Internal 1–5 value derived from a saved feeling label. */
export function periodFeelingValue(
  entry: { periods?: Partial<Record<CheckInPeriod, PeriodData>>; energy?: number } | null | undefined,
  period: CheckInPeriod,
): number | undefined {
  const label = periodFeeling(entry, period);
  if (label) return feelingValueForLabel(label) ?? undefined;
  return undefined;
}

export function isPeriodComplete(
  entry: { periods?: Partial<Record<CheckInPeriod, PeriodData>>; energy?: number } | null | undefined,
  period: CheckInPeriod,
): boolean {
  return periodFeeling(entry, period) != null;
}

const PERIOD_FALLBACK_HOUR: Record<CheckInPeriod, number> = {
  morning: 8,
  afternoon: 15,
  evening: 20,
};

function fallbackSubmittedAt(date: string, period: CheckInPeriod): string {
  const hour = String(PERIOD_FALLBACK_HOUR[period]).padStart(2, '0');
  return `${date}T${hour}:00:00`;
}

function backfillPeriodEntry(
  entry: { date: string; symptoms?: string[] },
  period: CheckInPeriod,
  data: PeriodData,
): PeriodCheckIn | null {
  const feeling =
    data.feeling ?? (data.energy != null ? feelingLabelForValue(data.energy) : null);
  if (!feeling) return null;
  return {
    feeling,
    symptoms: data.symptoms ?? entry.symptoms ?? ['None'],
    submittedAt: data.submittedAt ?? fallbackSubmittedAt(entry.date, period),
  };
}

export function normalizeDailyCheckIn<
  T extends {
    date?: string;
    periods?: Partial<Record<CheckInPeriod, PeriodData>>;
    energy?: number;
    symptoms?: string[];
  },
>(entry: T): T {
  const date = entry.date ?? localDateKey();

  if (!entry.periods && entry.energy == null) return { ...entry, date };

  if (!entry.periods && entry.energy != null) {
    const morning = backfillPeriodEntry({ date, symptoms: entry.symptoms }, 'morning', {
      energy: entry.energy,
    });
    return {
      ...entry,
      date,
      ...(morning ? { periods: { morning } } : {}),
    };
  }

  if (!entry.periods) return { ...entry, date };

  const periods: Partial<Record<CheckInPeriod, PeriodCheckIn>> = {};
  for (const period of CHECK_IN_PERIODS) {
    const data = entry.periods[period];
    if (!data) continue;
    const filled = backfillPeriodEntry({ date, symptoms: entry.symptoms }, period, data);
    if (filled) periods[period] = filled;
  }

  return { ...entry, date, periods };
}

/**
 * Maps Today period check-ins to Insights tab metrics:
 * - morning → sleepQuality (Sleep)
 * - afternoon → energy (Recovery)
 * - evening → stress, inverted (Stress — feeling bad = higher stress score)
 */
export function resolveDailyMetricsFromPeriods(
  entry: Pick<DailyCheckIn, 'periods' | 'energy' | 'sleepQuality' | 'stress'>,
): Pick<DailyCheckIn, 'energy' | 'sleepQuality' | 'stress'> {
  const morning = periodFeelingValue(entry, 'morning');
  const afternoon = periodFeelingValue(entry, 'afternoon');
  const evening = periodFeelingValue(entry, 'evening');

  return {
    energy: afternoon ?? entry.energy ?? 3,
    ...(morning != null
      ? { sleepQuality: morning }
      : entry.sleepQuality != null
        ? { sleepQuality: entry.sleepQuality }
        : {}),
    ...(evening != null
      ? { stress: 6 - evening }
      : entry.stress != null
        ? { stress: entry.stress }
        : {}),
  };
}

/** Saves or updates one period check-in and refreshes derived daily metrics. */
export function upsertPeriodCheckIn(
  existing: DailyCheckIn | null,
  dateKey: string,
  period: CheckInPeriod,
  input: { feeling: string; symptoms: string[]; submittedAt?: string },
): DailyCheckIn {
  const base = existing ? normalizeDailyCheckIn(existing) : null;
  const periodEntry: PeriodCheckIn = {
    feeling: input.feeling,
    symptoms: input.symptoms,
    submittedAt: input.submittedAt ?? new Date().toISOString(),
  };
  const periods = {
    ...(base?.periods ?? {}),
    [period]: periodEntry,
  };
  const feelingValue = feelingValueForLabel(input.feeling) ?? 3;
  const merged: DailyCheckIn = {
    date: dateKey,
    symptoms: input.symptoms,
    periods,
    energy: base?.energy ?? feelingValue,
    ...(base?.sleepQuality != null ? { sleepQuality: base.sleepQuality } : {}),
    ...(base?.stress != null ? { stress: base.stress } : {}),
  };
  return { ...merged, ...resolveDailyMetricsFromPeriods(merged) };
}
