import { RoutineDailyAction } from '@/types/routine';

/** Phrases that indicate advice/tips — not checkbox tasks. */
const TIP_TITLE_PATTERNS: RegExp[] = [
  /^consider\b/i,
  /^try to\b/i,
  /^remember\b/i,
  /^think about\b/i,
  /^focus on\b/i,
  /^be mindful\b/i,
  /^be aware\b/i,
  /^aim to\b/i,
  /^work on\b/i,
  /^prioritize\b/i,
  /^improve your\b/i,
  /^reduce your\b/i,
  /^limit your\b/i,
  /^avoid\b/i,
  /^don't forget\b/i,
  /^make sure you\b/i,
  /^it's important\b/i,
  /^you should\b/i,
  /^you could\b/i,
  /^you might\b/i,
  /^look for ways\b/i,
  /^pay attention to\b/i,
  /\bthroughout the day\b/i,
  /\bwhen you can\b/i,
  /\bwhen possible\b/i,
  /\bas needed\b/i,
  /\bif you can\b/i,
  /\btry to stay\b/i,
  /\btry to keep\b/i,
  /\bstay hydrated\b/i,
  /\bstay active\b/i,
  /\bstay consistent\b/i,
];

const IMPERATIVE_STARTS = [
  'drink',
  'take',
  'walk',
  'run',
  'eat',
  'set',
  'put',
  'place',
  'leave',
  'write',
  'log',
  'stretch',
  'fill',
  'refill',
  'charge',
  'dim',
  'wake',
  'plan',
  'add',
  'swap',
  'open',
  'close',
  'turn off',
  'turn on',
  'check off',
  'check',
  'complete',
  'do',
  'hold',
  'pause',
  'stop',
  'start',
  'pack',
  'prepare',
  'read',
  'listen',
  'breathe',
  'meditate',
  'note',
  'record',
  'track',
  'sit',
  'stand',
  'move',
  'wash',
  'brush',
  'make',
  'pick',
  'choose',
  'schedule',
  'send',
  'call',
  'text',
  'wear',
  'remove',
  'hide',
  'delete',
  'uninstall',
  'install',
  'eat',
  'finish',
  'go',
  'get',
  'have',
  'spend',
  'use',
  'skip',
  'unplug',
  'power off',
  'shut off',
  'lay out',
  'lay',
  'pack',
  'preheat',
  'cook',
  'prep',
  'count',
  'repeat',
  'perform',
  'practice',
];

export function looksLikeRoutineTip(title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (TIP_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;

  const lower = trimmed.toLowerCase();
  return !IMPERATIVE_STARTS.some((verb) => lower.startsWith(`${verb} `) || lower === verb);
}

export function validateDailyActions(actions: RoutineDailyAction[]): {
  valid: RoutineDailyAction[];
  rejected: RoutineDailyAction[];
} {
  const valid: RoutineDailyAction[] = [];
  const rejected: RoutineDailyAction[] = [];

  for (const action of actions) {
    if (!action.title || !action.doneWhen || !action.timeHint) {
      rejected.push(action);
      continue;
    }
    if (looksLikeRoutineTip(action.title)) {
      rejected.push(action);
      continue;
    }
    valid.push(action);
  }

  return { valid, rejected };
}

export function assertDailyActions(actions: RoutineDailyAction[]): RoutineDailyAction[] {
  const { valid, rejected } = validateDailyActions(actions);
  if (valid.length < 3) {
    const samples = rejected.map((a) => a.title).slice(0, 3);
    throw new Error(
      `Routine had too few actionable items (${valid.length} valid${samples.length ? `; rejected tips like: ${samples.join(', ')}` : ''})`,
    );
  }
  return valid.slice(0, 5);
}
