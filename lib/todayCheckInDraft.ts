export function todayCheckInDraftKey(feeling: number, symptoms: string[]): string {
  return `${feeling}|${symptoms.join('\u0001')}`;
}
