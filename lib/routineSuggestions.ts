import { CustomHabit, DailyCheckIn, PreventionHabit } from '@/types/health';

export interface RoutineSuggestion {
  id: string;
  title: string;
  detail: string;
}

export function getRoutineSuggestions(
  checkIn: DailyCheckIn | null,
  habits: PreventionHabit[],
  customHabits: CustomHabit[],
): RoutineSuggestion[] {
  const suggestions: RoutineSuggestion[] = [];
  const allHabits = [...habits, ...customHabits];
  const incomplete = allHabits.filter((h) => !h.completed);
  const completed = allHabits.length - incomplete.length;
  const completionPct = allHabits.length > 0 ? completed / allHabits.length : 0;

  if (!checkIn) {
    suggestions.push({
      id: 'check-in-missing',
      title: 'Complete your daily check-in',
      detail:
        'Log energy, sleep, stress, and symptoms in Routine so today’s plan matches how you feel.',
    });
  } else {
    if (checkIn.energy <= 2) {
      suggestions.push({
        id: 'low-energy',
        title: 'Protect your energy today',
        detail:
          'Your check-in shows low energy. Prioritize rest, hydration, and lighter movement until you recover.',
      });
    }
    if (checkIn.sleepQuality <= 2) {
      suggestions.push({
        id: 'poor-sleep',
        title: 'Support tonight’s sleep',
        detail:
          'Sleep quality was low. Keep your wind-down habit, dim screens early, and aim for a consistent bedtime.',
      });
    }
    if (checkIn.stress >= 4) {
      suggestions.push({
        id: 'high-stress',
        title: 'Downshift stress load',
        detail:
          'Stress is elevated. Add a short breathing break and protect time for habits that help you reset.',
      });
    }
    const symptoms = checkIn.symptoms.filter((s) => s !== 'None');
    if (symptoms.length > 0) {
      suggestions.push({
        id: 'symptoms',
        title: 'Act early on symptoms',
        detail: `You reported ${symptoms.join(', ')}. Rest, fluids, and gentle habits beat pushing through today.`,
      });
    }
    if (
      checkIn.energy >= 4 &&
      checkIn.sleepQuality >= 4 &&
      checkIn.stress <= 2 &&
      symptoms.length === 0
    ) {
      suggestions.push({
        id: 'steady-day',
        title: 'You’re on steady ground',
        detail: 'Check-in looks balanced. Stay consistent with your routine to keep momentum.',
      });
    }
  }

  if (incomplete.length > 0) {
    const sorted = [...incomplete].sort((a, b) => a.time.localeCompare(b.time));
    const next = sorted[0];
    suggestions.push({
      id: 'next-habit',
      title: `Focus next: ${next.title}`,
      detail: 'reason' in next ? next.reason : `Scheduled around ${next.time}.`,
    });
    if (completionPct <= 0.5) {
      suggestions.push({
        id: 'catch-up',
        title: 'Catch up on open habits',
        detail: `${incomplete.length} habit${incomplete.length === 1 ? '' : 's'} still open — tackle the earliest timed one first.`,
      });
    }
  } else if (allHabits.length > 0) {
    suggestions.push({
      id: 'habits-done',
      title: 'Routine checks complete',
      detail: 'All habits are done for today. Use any extra energy for recovery or prevention actions from your insights.',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'default',
      title: 'Build your routine',
      detail: 'Add habits in Routine and save a check-in to get a plan tailored to your day.',
    });
  }

  return suggestions;
}
