import { HealthSnapshot } from '@/lib/healthSnapshot';
import { DailyCheckIn, PreventionHabit } from '@/types/health';

export type GuideAction =
  | { type: 'habit'; habitId: string }
  | { type: 'routine' };

export interface ProfileGuideSuggestion {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  action: GuideAction;
  completed?: boolean;
}

function habitAction(
  id: string,
  habits: PreventionHabit[],
  title: string,
  body: string,
  doneLabel: string,
  todoLabel: string,
): ProfileGuideSuggestion | null {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return null;
  return {
    id,
    title,
    body,
    actionLabel: habit.completed ? doneLabel : todoLabel,
    action: { type: 'habit', habitId: id },
    completed: habit.completed,
  };
}

function weightBody(snapshot: HealthSnapshot): { title: string; body: string } {
  const { profile, recommendations } = snapshot;
  const range = `${profile.healthyWeightMinKg}–${profile.healthyWeightMaxKg} kg`;

  if (profile.weightBandStatus === 'within') {
    return {
      title: 'Keep your weight steady',
      body: `At ${profile.weightKg} kg you're in a healthy range for your height (${range}). On mostly sitting days, eating about ${recommendations.maintenanceSedentaryKcal.toLocaleString()} kcal tends to keep weight steady. If you walk most days, about ${recommendations.maintenanceWalkingKcal.toLocaleString()} kcal is a better fit.`,
    };
  }

  if (profile.weightBandStatus === 'above') {
    const offset = profile.weightKg - profile.healthyWeightMaxKg;
    return {
      title: 'Take a steady approach',
      body: `At ${profile.weightKg} kg you're about ${Math.round(offset)} kg above the healthy range for your height (${range}). Small, consistent changes work better than big swings — pick the calorie line that matches your typical day and track how you eat.`,
    };
  }

  const offset = profile.healthyWeightMinKg - profile.weightKg;
  return {
    title: 'Fuel your body well',
    body: `At ${profile.weightKg} kg you're about ${Math.round(offset)} kg below the healthy range for your height (${range}). Regular meals and enough calories support energy and recovery.`,
  };
}

export function buildProfileGuideSuggestions(
  snapshot: HealthSnapshot,
  habitIds: string[],
  habits: PreventionHabit[],
  checkIn: DailyCheckIn | null,
): ProfileGuideSuggestion[] {
  const items: ProfileGuideSuggestion[] = [];
  const { recommendations } = snapshot;

  if (!checkIn) {
    items.push({
      id: 'check-in',
      title: 'Start with a quick check-in',
      body: 'Log your energy, sleep, stress, and any symptoms. It takes a minute and helps the rest of your plan match how you actually feel.',
      actionLabel: 'Log check-in',
      action: { type: 'routine' },
    });
  }

  if (habitIds.includes('hydration')) {
    const item = habitAction(
      'hydration',
      habits,
      'Drink enough water',
      `Aim for about ${recommendations.dailyWaterLiters} L spread through the day — keep a bottle nearby and sip often.`,
      'Hydration logged ✓',
      'Log hydration',
    );
    if (item) items.push(item);
  }

  const sleepHabitId = habitIds.includes('sleep-schedule')
    ? 'sleep-schedule'
    : habitIds.includes('screen-time')
      ? 'screen-time'
      : null;

  if (sleepHabitId) {
    const sleepTitle =
      sleepHabitId === 'screen-time' ? 'Wind down from screens' : 'Protect your sleep tonight';
    const sleepBody = `For your age, ${recommendations.sleepMinHours}–${recommendations.sleepMaxHours} hours of sleep is a good target. A consistent bedtime makes the biggest difference.`;
    const item = habitAction(
      sleepHabitId,
      habits,
      sleepTitle,
      sleepBody,
      'Logged for today ✓',
      sleepHabitId === 'screen-time' ? 'Log screen-time habit' : 'Log sleep habit',
    );
    if (item) items.push(item);
  } else {
    items.push({
      id: 'sleep-tip',
      title: 'Plan for sleep tonight',
      body: `For your age, ${recommendations.sleepMinHours}–${recommendations.sleepMaxHours} hours is a good target. Try dimming screens and keeping a steady bedtime.`,
      actionLabel: 'Open routine',
      action: { type: 'routine' },
    });
  }

  if (habitIds.includes('eating-habits')) {
    const weight = weightBody(snapshot);
    const item = habitAction(
      'eating-habits',
      habits,
      weight.title,
      weight.body,
      'Eating habit logged ✓',
      'Log eating habit',
    );
    if (item) items.push(item);
  } else if (habitIds.includes('exercise-routine')) {
    const item = habitAction(
      'exercise-routine',
      habits,
      'Move your body today',
      'Even a short walk or stretch counts. Regular movement supports energy, sleep, and weight over time.',
      'Exercise logged ✓',
      'Log exercise',
    );
    if (item) items.push(item);
  } else {
    const weight = weightBody(snapshot);
    items.push({
      id: 'weight-tip',
      title: weight.title,
      body: weight.body,
      actionLabel: 'Open routine',
      action: { type: 'routine' },
    });
  }

  const openHabits = habits.filter((h) => !h.completed);
  if (checkIn && openHabits.length > 0 && items.length < 4) {
    const next = [...openHabits].sort((a, b) => a.time.localeCompare(b.time))[0];
    if (!items.some((item) => item.id === next.id)) {
      items.push({
        id: `next-${next.id}`,
        title: `Up next: ${next.title}`,
        body: next.reason,
        actionLabel: 'Log in routine',
        action: { type: 'habit', habitId: next.id },
        completed: false,
      });
    }
  }

  if (checkIn && openHabits.length === 0 && habits.length > 0) {
    return [
      {
        id: 'all-done',
        title: 'Nice work today',
        body: 'Your check-in and routine habits are logged. Keep this rhythm going — small daily steps add up.',
        actionLabel: 'Review routine',
        action: { type: 'routine' },
      },
    ];
  }

  return items.slice(0, 4);
}
