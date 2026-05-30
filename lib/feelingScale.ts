/** 1 = worst day, 5 = best — labels shown on Today. */
export const FEELING_OPTIONS = [
  { value: 1, label: 'Weak' },
  { value: 2, label: 'Drained' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Strong' },
  { value: 5, label: 'Energized' },
] as const;

export function feelingLabelForValue(value: number): string | null {
  return FEELING_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

export function metricsFromFeeling(value: number) {
  const clamped = Math.min(5, Math.max(1, value));
  return {
    energy: clamped,
    sleepQuality: clamped,
    stress: 6 - clamped,
  };
}
