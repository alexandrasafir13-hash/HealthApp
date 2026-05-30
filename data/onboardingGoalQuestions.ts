export type GoalQuestionKind = 'number' | 'single' | 'multi';

export interface GoalQuestionOption {
  id: string;
  label: string;
}

export interface GoalQuestion {
  id: string;
  title: string;
  explainer?: string;
  kind: GoalQuestionKind;
  placeholder?: string;
  options?: GoalQuestionOption[];
}

export const goalQuestionsByHabitId: Record<string, GoalQuestion[]> = {
  'sleep-schedule': [
    {
      id: 'sleep-hours',
      title: 'How many hours do you usually sleep?',
      explainer: 'Your best guess is fine — include naps if you take them.',
      kind: 'number',
      placeholder: 'e.g. 7',
    },
    {
      id: 'sleep-challenge',
      title: "What's your biggest sleep challenge?",
      kind: 'single',
      options: [
        { id: 'falling-asleep', label: 'Trouble falling asleep' },
        { id: 'waking-night', label: 'Waking during the night' },
        { id: 'waking-early', label: 'Waking too early' },
        { id: 'irregular-schedule', label: 'Irregular schedule' },
      ],
    },
  ],
  'exercise-routine': [
    {
      id: 'activity-level',
      title: 'How active are you on a typical day?',
      kind: 'single',
      options: [
        { id: 'mostly-sitting', label: 'Mostly sitting' },
        { id: 'light-activity', label: 'Some light activity' },
        { id: 'moderately-active', label: 'Moderately active' },
        { id: 'very-active', label: 'Very active' },
      ],
    },
    {
      id: 'movement-interests',
      title: 'What kinds of movement interest you?',
      explainer: 'Pick any that sound doable.',
      kind: 'multi',
      options: [
        { id: 'walking', label: 'Walking' },
        { id: 'running', label: 'Running' },
        { id: 'gym', label: 'Gym or weights' },
        { id: 'yoga', label: 'Yoga or stretching' },
        { id: 'sports', label: 'Sports' },
        { id: 'home-workouts', label: 'Home workouts' },
      ],
    },
  ],
  'eating-habits': [
    {
      id: 'eating-focus',
      title: 'What would help most with eating?',
      kind: 'multi',
      options: [
        { id: 'meal-planning', label: 'Planning meals' },
        { id: 'healthier-snacks', label: 'Healthier snacks' },
        { id: 'cooking-more', label: 'Cooking more' },
        { id: 'eating-out-less', label: 'Eating out less' },
        { id: 'portion-sizes', label: 'Portion sizes' },
      ],
    },
    {
      id: 'home-cooked-meals',
      title: 'How often do you eat home-cooked meals?',
      kind: 'single',
      options: [
        { id: 'rarely', label: 'Rarely' },
        { id: 'some-days', label: 'Some days' },
        { id: 'most-days', label: 'Most days' },
        { id: 'almost-always', label: 'Almost always' },
      ],
    },
  ],
  hydration: [
    {
      id: 'water-intake',
      title: 'About how many glasses of water do you drink daily?',
      explainer: 'One glass is about 250 ml / 8 oz.',
      kind: 'single',
      options: [
        { id: 'under-4', label: 'Less than 4' },
        { id: '4-6', label: '4–6' },
        { id: '7-8', label: '7–8' },
        { id: 'over-8', label: 'More than 8' },
      ],
    },
    {
      id: 'hydration-barriers',
      title: 'What makes staying hydrated harder?',
      kind: 'multi',
      options: [
        { id: 'forget', label: 'I forget' },
        { id: 'dislike-water', label: "Don't like plain water" },
        { id: 'too-busy', label: 'Too busy' },
        { id: 'unsure-amount', label: 'Not sure how much I need' },
      ],
    },
  ],
  'screen-time': [
    {
      id: 'phone-hours',
      title: 'How many hours do you use your phone daily?',
      explainer: 'Check Screen Time or your best estimate.',
      kind: 'single',
      options: [
        { id: 'under-2', label: 'Under 2 hours' },
        { id: '2-4', label: '2–4 hours' },
        { id: '4-6', label: '4–6 hours' },
        { id: 'over-6', label: 'More than 6 hours' },
      ],
    },
    {
      id: 'phone-uses',
      title: 'What do you mostly use it for?',
      kind: 'multi',
      options: [
        { id: 'messages', label: 'Messages' },
        { id: 'social-media', label: 'Social media' },
        { id: 'gaming', label: 'Gaming' },
        { id: 'videos', label: 'Videos or streaming' },
        { id: 'work-email', label: 'Work or email' },
        { id: 'news-browsing', label: 'News or browsing' },
      ],
    },
  ],
};

export function findGoalQuestion(habitId: string, questionId: string): GoalQuestion | undefined {
  return goalQuestionsByHabitId[habitId]?.find((q) => q.id === questionId);
}

export function labelForGoalAnswer(question: GoalQuestion, value: string | string[]): string {
  if (question.kind === 'number') {
    const hours = String(value).trim();
    return hours ? `${hours} hours` : '';
  }
  if (question.kind === 'single') {
    return question.options?.find((o) => o.id === value)?.label ?? String(value);
  }
  const ids = Array.isArray(value) ? value : [];
  return ids
    .map((id) => question.options?.find((o) => o.id === id)?.label ?? id)
    .join(', ');
}
