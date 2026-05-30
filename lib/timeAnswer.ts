import { PlanCheckInAnswer } from '@/lib/planCheckInStorage';

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
