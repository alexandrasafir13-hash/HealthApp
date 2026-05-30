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

export function accountStartDateKey(completedAt: string | undefined): string {
  if (!completedAt) return localDateKey();
  const parsed = new Date(completedAt);
  if (Number.isNaN(parsed.getTime())) return localDateKey();
  return localDateKey(parsed);
}
