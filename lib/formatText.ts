/** Ensure the first letter of each sentence is uppercase (. ! ? followed by space). */
export function capitalizeSentences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const first = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return first.replace(/([.!?]\s+)([a-z])/g, (_, punctuation, letter) => punctuation + letter.toUpperCase());
}
