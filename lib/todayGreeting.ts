export function timeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const FEELING_PROMPTS = [
  'How is your body today?',
  'Where is your energy right now?',
  'How do you feel in your body?',
] as const;

export function feelingPrompt(date = new Date()): string {
  return FEELING_PROMPTS[date.getDate() % FEELING_PROMPTS.length];
}

export function todayGreetingLine(name?: string): string {
  const greeting = timeGreeting();
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${greeting}, ${first}` : greeting;
}
