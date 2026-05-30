/** Pull a JSON value from model text (raw JSON, markdown fences, or embedded object). */
export function parseModelJson(text: string): unknown {
  const stripped = stripMarkdownFences(text.trim());
  if (!stripped) throw new Error('Empty model response');

  try {
    return JSON.parse(stripped);
  } catch {
    // continue
  }

  const objectText = extractBalancedJsonObject(stripped);
  if (!objectText) {
    throw new Error('Could not parse model JSON');
  }

  try {
    return JSON.parse(objectText);
  } catch {
    throw new Error('Could not parse model JSON');
  }
}

function stripMarkdownFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? text).trim();
}

function extractBalancedJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
