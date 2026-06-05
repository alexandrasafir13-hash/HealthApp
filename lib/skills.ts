/**
 * skills.ts
 *
 * Skill instructions for meal-prep-planning and medical-lab-results.
 * Injected into the system prompt after the intake (questioning) phase is done,
 * so the LLM follows the correct output rules when generating the final response.
 */

import type { ChatMessage } from '@/types/chat';

// ── Skill instructions ────────────────────────────────────────────────────────
// Written to work with the panel JSON format, not markdown prose.

const MEAL_PREP_SKILL = `MEAL PLANNING SKILL — apply this now.

The user has finished answering intake questions. You have everything you need. Generate the full meal plan immediately. Do not ask more questions.

CONTENT RULES
- Build around 2 to 4 reusable base components (cooked grain, protein, roasted veg, sauce).
- Use leftovers intentionally across days.
- Match the user's time, budget, skill level, and restrictions from the conversation above.
- No moral food language. No diet culture. No wellness-influencer tone.
- Every item must be something the user can immediately act on.

PANEL REQUIREMENTS
Set panel.type to "plan". The panel items must contain real content, not section headers.

Item structure to follow:
1. One item per day or meal group, kind: "phase". The label is the day or group (e.g. "Monday to Wednesday"). The sub field contains what they eat for each meal (e.g. "Breakfast: oats with banana. Lunch: rice bowl with chicken and roasted veg. Dinner: stir-fry using leftover rice.").
2. One item per prep step, kind: "todo". Each is a real concrete action (e.g. "Cook 3 cups of rice", "Roast 1 tray of mixed vegetables at 200 degrees for 30 minutes", "Portion chicken into 3 containers").
3. One item per grocery category, kind: "bullet". The label is the category name. The sub field lists the actual ingredients (e.g. label: "Produce", sub: "Broccoli, cherry tomatoes, spinach, 2 bell peppers").
4. One item for storage, kind: "bullet". Label: "Storage". Sub contains real instructions (e.g. "Rice: airtight container, fridge, good for 4 days. Chicken: eat by day 3.").
5. One item for backup meals, kind: "bullet". Label: "Backup meals". Sub lists 2 to 3 fast options for busy days.

The message field is 1 to 2 sentences confirming the plan was built from their answers. Nothing else in the message.`;

const MEDICAL_SKILL = `MEDICAL LAB RESULTS SKILL — apply this now.

The user has finished answering intake questions. You have enough context. Analyze the data immediately. Do not ask more questions.

CONTENT RULES
- Use the actual values, units, reference ranges, and flags from the documents or the conversation.
- Do not diagnose. Do not say "you have X."
- Use phrasing like "can be associated with" or "may suggest."
- Do not falsely reassure. Do not create panic.
- Flag genuinely abnormal results clearly. Do not over-flag mild deviations.
- Do not give medication or supplement instructions.

PANEL REQUIREMENTS
Set panel.type to "insight". The panel items must contain real content, not section headers.

Item structure to follow:
1. One item for the overall summary, kind: "text". Label: "Summary". Sub: 2 to 3 sentences explaining what the results show overall in plain language.
2. One item per significant finding, kind: "metric". The label is the marker name (e.g. "Hemoglobin"). The value field contains the result, unit, and reference range (e.g. "8.2 g/dL | ref: 12–16 g/dL"). The sub field explains what it may mean in plain language.
3. One item for reassuring results, kind: "bullet". Label: "What looks normal". Sub lists markers that are within range and worth mentioning.
4. One item for follow-up items, kind: "bullet". Label: "What to follow up". Sub lists abnormal or borderline items and why they matter.
5. One item per question the user should ask their doctor, kind: "todo". The label is the actual question (e.g. "Should this result be repeated in 4 to 6 weeks?").

The message field is 1 to 2 sentences with the most important takeaway from the results. Nothing else in the message.`;

const EXERCISE_SKILL = `GENTLE EXERCISE AND MOVEMENT SKILL — apply this now.

The user has finished answering intake questions. You have enough context. Generate the full movement plan immediately. Do not ask more questions.

CONTENT RULES
- Prioritize safety, consistency, and realism over intensity.
- Prefer walking, light cardio, mobility, stretching, balance, and simple bodyweight strength.
- Match the plan to the user's actual situation: activity level, time, equipment, injuries, energy, and goals from the conversation above.
- Start smaller than the user expects. The first plan should feel almost too easy.
- Do not frame exercise as punishment for eating or weight loss.
- No shame, guilt, or fear. No drill-sergeant tone.
- If the user mentions chest pain, fainting, heart disease, recent surgery, severe joint pain, or stroke symptoms — advise them to check with a clinician before starting. Do not build a plan that ignores these.

PANEL REQUIREMENTS
Set panel.type to "plan". The panel items must contain real content, not section headers.

Item structure to follow:
1. One item per session type, kind: "phase". The label is the session name or day (e.g. "Session A — Walking + Mobility"). The sub field describes exactly what to do (e.g. "Walk 10–15 min at an easy pace. Then: 5 shoulder rolls, 5 hip circles, 5 gentle spinal rotations. Total: ~20 min.").
2. One item for the weekly schedule, kind: "bullet". Label: "Weekly schedule". Sub lists the days and what goes on each (e.g. "Monday: Session A. Wednesday: Session B. Friday: Session A. Optional: short easy walks on other days.").
3. One item per progression step, kind: "bullet". Label: "How to progress". Sub describes one small change at a time (e.g. "After 1–2 weeks add 5 min to one walk, or add one extra round to the strength session. Never increase duration, intensity, and frequency at the same time.").
4. One item for the fallback, kind: "todo". Label: "Low-energy fallback". Sub is a minimal version of the plan for bad days (e.g. "5 min walk + 5 sit-to-stands + 5 wall push-ups + 1 min gentle stretch. That still counts.").
5. One item for safety, kind: "bullet". Label: "Stop or modify if". Sub lists the conditions: sharp pain, pain that changes movement, chest pain, dizziness, numbness, or tingling. Keep it short and not alarming.

The message field is 1–2 sentences confirming the plan matches their situation. Nothing else.`;

// ── Types ─────────────────────────────────────────────────────────────────────

export type SkillName = 'medical' | 'meal-prep' | 'exercise';

// ── Keyword sets ──────────────────────────────────────────────────────────────

const MEDICAL_KEYWORDS = [
  'blood test', 'lab result', 'lab report', 'blood work', 'bloodwork',
  'cbc', 'hemoglobin', 'haemoglobin', 'hematocrit', 'haematocrit',
  'cholesterol', 'triglyceride', 'glucose', 'insulin', 'hba1c', 'a1c',
  'thyroid', 'tsh', 't3', 't4', 'liver', 'kidney', 'creatinine',
  'vitamin d', 'vitamin b', 'ferritin', 'iron', 'calcium', 'potassium',
  'sodium', 'white blood cell', 'red blood cell', 'platelet',
  'imaging', 'mri', 'ct scan', 'x-ray', 'ultrasound', 'ecg', 'ekg',
  'discharge', 'referral', 'specialist letter', 'medical letter', 'medical report',
  'diagnosis', 'abnormal', 'out of range', 'reference range',
  // Romanian — kept only for detection, not for output
  'analize', 'rezultat', 'hemoleucograma', 'hemoglobina', 'colesterol',
  'trigliceride', 'glicemie', 'insulina', 'tiroida', 'ficat', 'rinichi',
  'vitamina', 'fier', 'calciu', 'trombocite', 'leucocite', 'eritrocite',
  'scrisoare medicala', 'bilet de externare', 'consultatie', 'diagnostic',
];

const MEAL_PREP_KEYWORDS = [
  'meal prep', 'meal plan', 'weekly plan', 'weekly meals', 'food prep',
  'grocery', 'groceries', 'shopping list', 'what to eat', 'what can i cook',
  'what can i make', 'cook', 'cooking', 'recipe', 'recipes',
  'breakfast', 'lunch', 'dinner', 'snack', 'meal', 'meals',
  'eat healthier', 'eat better', 'diet plan', 'nutrition plan',
  'batch cook', 'leftovers', 'pantry', 'fridge', 'prepping food',
  'too much takeout', 'takeaway', 'fast food', 'junk food',
  // Romanian — kept only for detection, not for output
  'mancare', 'gatit', 'reteta', 'cumparaturi', 'lista de cumparaturi',
  'mic dejun', 'pranz', 'cina', 'gustare', 'planificare mese', 'preparare mese',
];

const EXERCISE_KEYWORDS = [
  'exercise', 'workout', 'movement', 'move more', 'moving more',
  'walk more', 'walking', 'start exercising', 'get active', 'get fit',
  'less sedentary', 'sit too much', 'sitting too much', 'too sedentary',
  'beginner workout', 'beginner exercise', 'light exercise', 'low impact',
  'home workout', 'no gym', 'bodyweight', 'mobility', 'stretching',
  'flexibility', 'fitness routine', 'fitness plan', 'activity plan',
  'get back into exercise', 'get back into shape', 'build consistency',
  'cardio', 'steps', 'step count', 'pedometer',
  // Romanian — kept only for detection, not for output
  'exercitii', 'exerciții', 'miscare', 'mișcare', 'antrenament',
  'mers pe jos', 'plimbare', 'sport', 'activitate fizica', 'activitate fizică',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function allUserText(history: ChatMessage[]): string {
  return history
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ')
    .toLowerCase();
}

/**
 * Returns true when the intake/questioning phase is complete —
 * i.e. at least one assistant question card has been answered by the user.
 */
export function isIntakeComplete(history: ChatMessage[]): boolean {
  return history.some(
    (m) => m.role === 'assistant' && m.answered === true && (m.questions?.length ?? 0) > 0,
  );
}

/**
 * Scans ALL user messages across the full conversation for topic keywords.
 * Medical is checked first — if the user mentions both medical and food topics,
 * medical wins (e.g. "what should I eat given my lab results").
 */
export function detectSkill(history: ChatMessage[]): SkillName | null {
  const text = allUserText(history);

  if (MEDICAL_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'medical';
  }

  if (MEAL_PREP_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'meal-prep';
  }

  if (EXERCISE_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'exercise';
  }

  return null;
}

/**
 * Returns the skill instructions to inject into the system prompt,
 * or null if intake is not done or no skill matches.
 */
export function getSkillInstructions(history: ChatMessage[]): string | null {
  if (!isIntakeComplete(history)) return null;

  const skill = detectSkill(history);
  if (!skill) return null;

  if (skill === 'medical') return MEDICAL_SKILL;
  if (skill === 'meal-prep') return MEAL_PREP_SKILL;
  if (skill === 'exercise') return EXERCISE_SKILL;
  return null;
}
