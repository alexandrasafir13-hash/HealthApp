export function timeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function todayGreetingLine(name?: string): string {
  const greeting = timeGreeting();
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'guest') {
    return greeting;
  }
  const first = trimmed.split(/\s+/)[0];
  return `${greeting}, ${first}`;
}
