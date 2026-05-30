/** 1 = worst day, 5 = best — labels shown on Today. */
export const FEELING_OPTIONS = [
  { value: 1, label: 'Weak' },
  { value: 2, label: 'Drained' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Strong' },
  { value: 5, label: 'Energized' },
] as const;

export type FeelingLabel = (typeof FEELING_OPTIONS)[number]['label'];

export function feelingLabelForValue(value: number): FeelingLabel | null {
  return FEELING_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

export function feelingValueForLabel(label: string): number | null {
  return FEELING_OPTIONS.find((o) => o.label === label)?.value ?? null;
}

/** Maps Today body-feeling (1–5) to stored energy only. Sleep/stress are not inferred. */
export function metricsFromFeeling(value: number) {
  const clamped = Math.min(5, Math.max(1, value));
  return { energy: clamped };
}
