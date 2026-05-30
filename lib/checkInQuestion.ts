import { CheckInAnswerType, DailyCheckInQuestion } from '@/types/plan';

const ANSWER_TYPES: CheckInAnswerType[] = [
  'number',
  'scale_1_5',
  'single_choice',
  'multi_choice',
  'short_text',
  'time',
];

const ANSWER_TYPE_ALIASES: Record<string, CheckInAnswerType> = {
  number: 'number',
  numeric: 'number',
  scale_1_5: 'scale_1_5',
  scale: 'scale_1_5',
  single_choice: 'single_choice',
  multi_choice: 'multi_choice',
  short_text: 'short_text',
  text: 'short_text',
  time: 'time',
};

const NUMBER_UNIT_PATTERN =
  /^(hours?|hrs?|h|min(utes?)?|mins?|sec(onds?)?|secs?|glasses?|cups?|steps|km|mi|miles|lbs?|kg|g|ml|l|oz|cal(ories)?|kcal|%)$/i;

const TIME_QUESTION_PATTERN =
  /\b(what time|at what time|bedtime|wake.?time|wake.?up|when did you (go to bed|wake|sleep))\b/i;

function coerceAnswerType(raw: string): CheckInAnswerType | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const alias = ANSWER_TYPE_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  return ANSWER_TYPES.includes(trimmed as CheckInAnswerType) ? (trimmed as CheckInAnswerType) : null;
}

function inferAnswerType(
  answerType: CheckInAnswerType,
  question: string,
  unit: string | null,
): CheckInAnswerType {
  if (answerType !== 'short_text') return answerType;

  const unitTrim = unit?.trim() ?? '';
  if (unitTrim && (NUMBER_UNIT_PATTERN.test(unitTrim) || unitTrim.toLowerCase() === 'time')) {
    return unitTrim.toLowerCase() === 'time' ? 'time' : 'number';
  }

  if (TIME_QUESTION_PATTERN.test(question)) return 'time';

  const q = question.toLowerCase();
  if (/\bhow many\b|\bhow much\b|\bhow long\b|\bnumber of\b|\bcount\b/.test(q)) {
    return 'number';
  }

  return answerType;
}

export function normalizeDailyCheckInQuestion(raw: unknown): DailyCheckInQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const id = String(obj.id ?? '').trim();
  const question = String(obj.question ?? obj.label ?? '').trim();
  const answerTypeRaw = coerceAnswerType(String(obj.answerType ?? obj.type ?? ''));
  if (!id || !question || !answerTypeRaw) return null;

  const options = Array.isArray(obj.options)
    ? obj.options.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : null;
  const unitRaw = obj.unit;
  const unit = unitRaw == null ? null : String(unitRaw).trim() || null;

  const answerType = inferAnswerType(answerTypeRaw, question, unit);

  return {
    id,
    question,
    answerType,
    required: obj.required !== false,
    options: options && options.length > 0 ? options : null,
    unit,
  };
}
