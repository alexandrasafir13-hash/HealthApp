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
      title: 'Câte ore dormi de obicei?',
      explainer: 'O estimare este suficientă — include și somnul de peste zi, dacă faci.',
      kind: 'number',
      placeholder: 'e.g. 7',
    },
    {
      id: 'sleep-challenge',
      title: 'Care este cea mai mare provocare legată de somn?',
      kind: 'single',
      options: [
        { id: 'falling-asleep', label: 'Dificultate la adormire' },
        { id: 'waking-night', label: 'Treziri în timpul nopții' },
        { id: 'waking-early', label: 'Trezire prea devreme' },
        { id: 'irregular-schedule', label: 'Program neregulat' },
      ],
    },
  ],
  'exercise-routine': [
    {
      id: 'activity-level',
      title: 'Cât de activ ești într-o zi obișnuită?',
      kind: 'single',
      options: [
        { id: 'mostly-sitting', label: 'Mai mult stai jos' },
        { id: 'light-activity', label: 'Puțină activitate ușoară' },
        { id: 'moderately-active', label: 'Moderat activ' },
        { id: 'very-active', label: 'Foarte activ' },
      ],
    },
    {
      id: 'movement-interests',
      title: 'Ce tipuri de mișcare te interesează?',
      explainer: 'Alege tot ce ți se pare realizabil.',
      kind: 'multi',
      options: [
        { id: 'walking', label: 'Mers pe jos' },
        { id: 'running', label: 'Alergare' },
        { id: 'gym', label: 'Sală sau greutăți' },
        { id: 'yoga', label: 'Yoga sau întinderi' },
        { id: 'sports', label: 'Sporturi' },
        { id: 'home-workouts', label: 'Antrenamente acasă' },
      ],
    },
  ],
  'eating-habits': [
    {
      id: 'eating-focus',
      title: 'Ce te-ar ajuta cel mai mult la alimentație?',
      kind: 'multi',
      options: [
        { id: 'meal-planning', label: 'Planificarea meselor' },
        { id: 'healthier-snacks', label: 'Gustări mai sănătoase' },
        { id: 'cooking-more', label: 'Gătit mai des' },
        { id: 'eating-out-less', label: 'Mâncat mai rar în oraș' },
        { id: 'portion-sizes', label: 'Porții mai potrivite' },
      ],
    },
    {
      id: 'home-cooked-meals',
      title: 'Cât de des mănânci preparate gătite acasă?',
      kind: 'single',
      options: [
        { id: 'rarely', label: 'Rar' },
        { id: 'some-days', label: 'În unele zile' },
        { id: 'most-days', label: 'În majoritatea zilelor' },
        { id: 'almost-always', label: 'Aproape mereu' },
      ],
    },
  ],
  hydration: [
    {
      id: 'water-intake',
      title: 'Cam câte pahare de apă bei zilnic?',
      explainer: 'Un pahar are aproximativ 250 ml / 8 oz.',
      kind: 'single',
      options: [
        { id: 'under-4', label: 'Sub 4' },
        { id: '4-6', label: '4–6' },
        { id: '7-8', label: '7–8' },
        { id: 'over-8', label: 'Peste 8' },
      ],
    },
    {
      id: 'hydration-barriers',
      title: 'Ce face hidratarea mai dificilă?',
      kind: 'multi',
      options: [
        { id: 'forget', label: 'Uit' },
        { id: 'dislike-water', label: 'Nu-mi place apa simplă' },
        { id: 'too-busy', label: 'Sunt prea ocupat' },
        { id: 'unsure-amount', label: 'Nu știu cât am nevoie' },
      ],
    },
  ],
  'screen-time': [
    {
      id: 'phone-hours',
      title: 'Câte ore folosești telefonul zilnic?',
      explainer: 'Verifică Screen Time sau estimează cât mai bine.',
      kind: 'single',
      options: [
        { id: 'under-2', label: 'Sub 2 ore' },
        { id: '2-4', label: '2–4 hours' },
        { id: '4-6', label: '4–6 hours' },
        { id: 'over-6', label: 'Peste 6 ore' },
      ],
    },
    {
      id: 'phone-uses',
      title: 'Pentru ce îl folosești cel mai mult?',
      kind: 'multi',
      options: [
        { id: 'messages', label: 'Mesaje' },
        { id: 'social-media', label: 'Rețele sociale' },
        { id: 'gaming', label: 'Jocuri' },
        { id: 'videos', label: 'Videoclipuri sau streaming' },
        { id: 'work-email', label: 'Muncă sau e-mail' },
        { id: 'news-browsing', label: 'Știri sau navigare' },
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
    return hours ? `${hours} ore` : '';
  }
  if (question.kind === 'single') {
    return question.options?.find((o) => o.id === value)?.label ?? String(value);
  }
  const ids = Array.isArray(value) ? value : [];
  return ids
    .map((id) => question.options?.find((o) => o.id === id)?.label ?? id)
    .join(', ');
}
