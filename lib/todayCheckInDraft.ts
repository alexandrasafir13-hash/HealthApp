import { CheckInPeriod } from '@/lib/checkInPeriod';

export function todayCheckInDraftKey(
  period: CheckInPeriod,
  feeling: string,
  symptoms: string[],
): string {
  return `${period}|${feeling}|${symptoms.join('\u0001')}`;
}
