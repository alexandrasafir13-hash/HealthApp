/** Ensure the first letter of each sentence is uppercase (. ! ? followed by space). */
export function capitalizeSentences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const first = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return first.replace(/([.!?]\s+)([a-z])/g, (_, punctuation, letter) => punctuation + letter.toUpperCase());
}

/** Convert a duration string like "5 minutes" or "2 hours" to short form "5m" or "2h". */
export function shortDuration(duration: string | null): string | null {
  if (!duration) return null;
  const trimmed = duration.trim().toLowerCase();
  const match = trimmed.match(/^(\d+(?:\s*(?:-|to)\s*\d+)?)\s*(second|sec|minute|min|hour|hr|day|week|month)s?\b/);
  if (!match) return trimmed;
  const numRange = match[1].replace(/\s*to\s*/g, '-').replace(/\s+/g, '');
  const unit = match[2];
  const map: Record<string, string> = {
    second: 's',
    sec: 's',
    minute: 'm',
    min: 'm',
    hour: 'h',
    hr: 'h',
    day: 'd',
    week: 'w',
    month: 'mo',
  };
  return `${numRange}${map[unit] || unit}`;
}
