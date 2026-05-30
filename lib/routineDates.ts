import { localDateKey } from '@/lib/localDate';

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysToDateKey(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function clampDateKey(key: string, minKey: string, maxKey: string): string {
  if (compareDateKeys(key, minKey) < 0) return minKey;
  if (compareDateKeys(key, maxKey) > 0) return maxKey;
  return key;
}

export function accountStartDateKey(completedAt: string | undefined): string {
  if (!completedAt) return localDateKey();
  const parsed = new Date(completedAt);
  if (Number.isNaN(parsed.getTime())) return localDateKey();
  return localDateKey(parsed);
}

export function formatRoutineDateLabel(dateKey: string, todayKey = localDateKey()): string {
  if (dateKey === todayKey) return 'Today';
  const yesterday = addDaysToDateKey(todayKey, -1);
  if (dateKey === yesterday) return 'Yesterday';

  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRoutineHabitsTitle(dateKey: string, todayKey = localDateKey()): string {
  if (dateKey === todayKey) return "Today's habits";
  const yesterday = addDaysToDateKey(todayKey, -1);
  if (dateKey === yesterday) return "Yesterday's habits";
  return `${formatRoutineDateLabel(dateKey, todayKey)} habits`;
}

export function applyHabitCompletions<T extends { id: string; completed: boolean }>(
  items: T[],
  log: Record<string, Record<string, boolean>>,
  dateKey: string,
): T[] {
  const day = log[dateKey] ?? {};
  return items.map((item) => ({
    ...item,
    completed: !!day[item.id],
  }));
}

export function habitCompletionStats(
  habitIds: string[],
  log: Record<string, Record<string, boolean>>,
  dateKey: string,
): { completed: number; total: number } {
  const day = log[dateKey] ?? {};
  const completed = habitIds.filter((id) => day[id]).length;
  return { completed, total: habitIds.length };
}

export function dateKeyFromParts(year: number, monthIndex: number, day: number): string {
  return localDateKey(new Date(year, monthIndex, day));
}

export interface CalendarDay {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
}

export function buildMonthGrid(year: number, monthIndex: number): CalendarDay[] {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: CalendarDay[] = [];

  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const prevYear = monthIndex === 0 ? year - 1 : year;
  const prevMonthDays = new Date(prevYear, prevMonthIndex + 1, 0).getDate();

  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push({
      dateKey: dateKeyFromParts(prevYear, prevMonthIndex, day),
      day,
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      dateKey: dateKeyFromParts(year, monthIndex, day),
      day,
      inCurrentMonth: true,
    });
  }

  let nextDay = 1;
  const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  while (cells.length < 42) {
    cells.push({
      dateKey: dateKeyFromParts(nextYear, nextMonthIndex, nextDay),
      day: nextDay,
      inCurrentMonth: false,
    });
    nextDay++;
  }

  return cells;
}

export function isDateKeyInRange(dateKey: string, minKey: string, maxKey: string): boolean {
  return compareDateKeys(dateKey, minKey) >= 0 && compareDateKeys(dateKey, maxKey) <= 0;
}

export function monthYearLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}
