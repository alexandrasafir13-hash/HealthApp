export function timeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function todayGreetingLine(name?: string): string {
  const greeting = timeGreeting();
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${greeting}, ${first}` : greeting;
}
