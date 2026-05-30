import { PlanCheckInAnswer } from '@/lib/planCheckInStorage';

export function to12HourParts(date: Date): { hour: number; minute: number; period: 'AM' | 'PM' } {
  const hours24 = date.getHours();
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hour = hours24 % 12 || 12;
  return { hour, minute: date.getMinutes(), period };
}

export function from12HourParts(hour: number, minute: number, period: 'AM' | 'PM'): Date {
  let hours24 = hour % 12;
  if (period === 'PM') hours24 += 12;
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMilliseconds(0);
  date.setHours(hours24, minute, 0, 0);
  return date;
}

export function formatTimeAnswer(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function parseTimeAnswer(value: PlanCheckInAnswer | undefined): Date {
  const fallback = () => {
    const date = new Date();
    date.setSeconds(0, 0);
    date.setMilliseconds(0);
    date.setHours(9, 0, 0, 0);
    return date;
  };

  if (typeof value !== 'string' || !value.trim()) return fallback();

  const trimmed = value.trim();
  const parsed = Date.parse(`January 1, 1970 ${trimmed}`);
  if (Number.isFinite(parsed)) {
    const fromText = new Date(parsed);
    const date = new Date();
    date.setSeconds(0, 0);
    date.setMilliseconds(0);
    date.setHours(fromText.getHours(), fromText.getMinutes(), 0, 0);
    return date;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const date = new Date();
    date.setSeconds(0, 0);
    date.setMilliseconds(0);
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return date;
  }

  return fallback();
}
