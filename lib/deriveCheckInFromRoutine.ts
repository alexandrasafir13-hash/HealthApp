import { CustomHabit, DailyCheckIn, PreventionHabit } from '@/types/health';

type HabitLike = { id: string; title: string; completed: boolean };
export type MetricTag = 'sleep' | 'energy' | 'stress' | 'immunity';

const HABIT_TAGS: Record<string, MetricTag[]> = {
  'morning-sun': ['sleep', 'energy'],
  h1: ['sleep', 'energy'],
  hydration: ['energy', 'immunity'],
  h2: ['energy', 'immunity'],
  movement: ['energy', 'stress'],
  'wind-down': ['sleep'],
  h3: ['sleep'],
  breathing: ['stress'],
  'sleep-duration': ['sleep', 'energy'],
  'healthy-meals': ['energy', 'immunity'],
  'evening-checkin': ['immunity'],
  h4: ['immunity'],
};

function tagsForHabit(habit: HabitLike): MetricTag[] {
  if (HABIT_TAGS[habit.id]) return HABIT_TAGS[habit.id];
  const title = habit.title.toLowerCase();
  if (title.includes('sleep') || title.includes('wind') || title.includes('bed')) return ['sleep'];
  if (title.includes('breath') || title.includes('stress') || title.includes('meditat')) return ['stress'];
  if (title.includes('water') || title.includes('hydrat') || title.includes('immune')) {
    return ['energy', 'immunity'];
  }
  if (title.includes('move') || title.includes('walk') || title.includes('stretch')) {
    return ['energy', 'stress'];
  }
  return ['energy'];
}

function ratioForTag(habits: HabitLike[], tag: MetricTag): number | null {
  const tagged = habits.filter((h) => tagsForHabit(h).includes(tag));
  if (tagged.length === 0) return null;
  return tagged.filter((h) => h.completed).length / tagged.length;
}

export function categoryCompletionForDate(
  habits: PreventionHabit[],
  customHabits: CustomHabit[],
  log: Record<string, Record<string, boolean>>,
  dateKey: string,
  tag: MetricTag,
): number | null {
  const datedHabits = habits.map((h) => ({
    ...h,
    completed: !!log[dateKey]?.[h.id],
  }));
  const datedCustom = customHabits.map((h) => ({
    ...h,
    completed: !!log[dateKey]?.[h.id],
  }));
  return ratioForTag([...datedHabits, ...datedCustom], tag);
}

export function averageCategoryCompletion(
  dateKeys: string[],
  habits: PreventionHabit[],
  customHabits: CustomHabit[],
  log: Record<string, Record<string, boolean>>,
  tag: MetricTag,
): number | null {
  const values: number[] = [];
  for (const dateKey of dateKeys) {
    const ratio = categoryCompletionForDate(habits, customHabits, log, dateKey, tag);
    if (ratio != null) values.push(ratio);
  }
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scaleFromRatio(ratio: number): number {
  if (ratio >= 1) return 5;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

export function deriveRoutineMetrics(
  habits: PreventionHabit[],
  customHabits: CustomHabit[],
): Pick<DailyCheckIn, 'energy' | 'sleepQuality' | 'stress'> {
  const all: HabitLike[] = [...habits, ...customHabits];
  const overall =
    all.length > 0 ? all.filter((h) => h.completed).length / all.length : 0;

  const sleepRatio = ratioForTag(all, 'sleep') ?? overall;
  const energyRatio = ratioForTag(all, 'energy') ?? overall;
  const stressRatio = ratioForTag(all, 'stress') ?? overall;

  return {
    energy: all.length > 0 ? scaleFromRatio(energyRatio) : 3,
    sleepQuality: all.length > 0 ? scaleFromRatio(sleepRatio) : 3,
    stress: all.length > 0 ? 6 - scaleFromRatio(stressRatio) : 3,
  };
}

export function routineHabitsForMetric(
  habits: PreventionHabit[],
  customHabits: CustomHabit[],
  tag: MetricTag,
): HabitLike[] {
  return [...habits, ...customHabits].filter((h) => tagsForHabit(h).includes(tag));
}
