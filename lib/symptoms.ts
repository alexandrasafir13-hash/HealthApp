export const PRESET_SYMPTOMS = [
  'None',
  'Fatigue',
  'Headache',
  'Sore throat',
  'Congestion',
  'Body aches',
] as const;

/** Stable fallback — do not inline `['None']` or useEffect deps will churn. */
export const DEFAULT_SYMPTOMS: readonly string[] = ['None'];

export function parseCustomSymptoms(text: string): string[] {
  return text
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function splitSavedSymptoms(all: string[]) {
  const presets = all.filter((s) => (PRESET_SYMPTOMS as readonly string[]).includes(s));
  const custom = all.filter((s) => !(PRESET_SYMPTOMS as readonly string[]).includes(s));
  return { presets, custom };
}
