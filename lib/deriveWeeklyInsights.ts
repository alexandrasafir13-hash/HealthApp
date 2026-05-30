import { CheckInLog } from '@/lib/checkInStorage';
import {
  averageCategoryCompletion,
  deriveRoutineMetrics,
  MetricTag,
  routineHabitsForMetric,
} from '@/lib/deriveCheckInFromRoutine';
import { hasReportedSymptoms } from '@/lib/deriveInsightsFromCheckIn';
import { HabitCompletionLog } from '@/lib/habitCompletionStorage';
import { localDateKey } from '@/lib/localDate';
import { addDaysToDateKey, applyHabitCompletions, compareDateKeys } from '@/lib/routineDates';
import {
  BodyInsight,
  DailyCheckIn,
  HealthAction,
  InsightSeverity,
  SummarySegment,
} from '@/types/health';

const WINDOW_DAYS = 7;
export const SLEEP_TRACKING_TIMEFRAME = '8–10h nightly';
export const WEEKLY_HABIT_TRACKING_LABEL = 'Past week';

interface HabitWeekStat {
  id: string;
  title: string;
  completionRate: number;
}

const HABIT_SUGGESTIONS: Record<string, string> = {
  'wind-down':
    'Tonight, try 15 minutes without screens before bed — your wind-down habit protects sleep more than you might think.',
  h3: 'Tonight, try 15 minutes without screens before bed — your wind-down habit protects sleep more than you might think.',
  'sleep-duration':
    'Aim for 8–10 hours tonight. Pick a wake time you can repeat tomorrow — consistency helps.',
  'morning-sun':
    'Step outside for a few minutes of morning light — it gently anchors your sleep-wake rhythm.',
  h1: 'Step outside for a few minutes of morning light — it gently anchors your sleep-wake rhythm.',
  hydration: 'Keep water within reach today — small sips through the day support recovery.',
  h2: 'Keep water within reach today — small sips through the day support recovery.',
  movement:
    'A short walk or stretch break helps energy and stress alike — even five minutes is a win.',
  'healthy-meals':
    'One nourishing meal today gives your body steady fuel for recovery and immune health.',
  breathing:
    'Try a breathing reset this afternoon — inhale 4s, hold 4s, exhale 4s, hold 4s, and repeat a few times.',
  'evening-checkin':
    'A quick evening check-in tonight helps you notice how your body feels before symptoms build.',
  h4: 'A quick evening check-in tonight helps you notice how your body feels before symptoms build.',
};

export interface WeeklyInsightInput {
  habits: PreventionHabit[];
  customHabits: CustomHabit[];
  habitCompletions: HabitCompletionLog;
  checkInLog: CheckInLog;
  accountStartDate: string;
  todayKey?: string;
}

export interface WeekInsightStats {
  windowDays: number;
  dateKeys: string[];
  checkIns: DailyCheckIn[];
  daysTracked: number;
  avgSleepQuality: number | null;
  avgEnergy: number | null;
  avgStress: number | null;
  sleepHabitPct: number | null;
  energyHabitPct: number | null;
  stressHabitPct: number | null;
  immunityHabitPct: number | null;
  symptomDays: number;
  uniqueSymptoms: string[];
  lowSleepDays: number;
  lowEnergyDays: number;
  highStressDays: number;
  avgSleepHours: number | null;
}

/** Maps routine sleep quality (1–5) to estimated hours for the 8–10h tracking window. */
export function estimatedSleepHoursFromQuality(sleepQuality: number): number {
  const hours = 4 + (sleepQuality - 1) * 1.5;
  return Math.round(hours * 10) / 10;
}

export function getPastWeekDateKeys(
  todayKey = localDateKey(),
  minDate: string,
  days = WINDOW_DAYS,
): string[] {
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const key = addDaysToDateKey(todayKey, -offset);
    if (compareDateKeys(key, minDate) < 0) continue;
    keys.push(key);
  }
  return keys;
}

export function buildCheckInForDate(
  dateKey: string,
  habits: PreventionHabit[],
  customHabits: CustomHabit[],
  habitCompletions: HabitCompletionLog,
  checkInLog: CheckInLog,
  symptomsOverride?: string[],
): DailyCheckIn | null {
  const datedHabits = applyHabitCompletions(habits, habitCompletions, dateKey);
  const datedCustom = applyHabitCompletions(customHabits, habitCompletions, dateKey);
  const all = [...datedHabits, ...datedCustom];
  const total = all.length;
  const hasActivity = total > 0 && all.some((h) => h.completed);

  const logged = checkInLog[dateKey];
  const symptoms = symptomsOverride ?? logged?.symptoms ?? ['None'];
  const hasSymptoms = hasReportedSymptoms({ date: dateKey, symptoms } as DailyCheckIn);

  if (!hasActivity && !hasSymptoms) return null;

  const metrics =
    total > 0
      ? deriveRoutineMetrics(datedHabits, datedCustom)
      : logged
        ? {
            energy: logged.energy,
            sleepQuality: logged.sleepQuality,
            stress: logged.stress,
          }
        : { energy: 3, sleepQuality: 3, stress: 3 };

  return { ...metrics, symptoms, date: dateKey };
}

export function computeWeekInsightStats(input: WeeklyInsightInput): WeekInsightStats {
  const todayKey = input.todayKey ?? localDateKey();
  const dateKeys = getPastWeekDateKeys(todayKey, input.accountStartDate);
  const checkIns = dateKeys
    .map((dateKey) =>
      buildCheckInForDate(
        dateKey,
        input.habits,
        input.customHabits,
        input.habitCompletions,
        input.checkInLog,
      ),
    )
    .filter((entry): entry is DailyCheckIn => entry != null);

  const avg = (values: number[]) =>
    values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

  const symptomDays = checkIns.filter((entry) => hasReportedSymptoms(entry)).length;
  const uniqueSymptoms = [
    ...new Set(
      checkIns.flatMap((entry) => entry.symptoms.filter((symptom) => symptom !== 'None')),
    ),
  ];

  return {
    windowDays: dateKeys.length,
    dateKeys,
    checkIns,
    daysTracked: checkIns.length,
    avgSleepQuality: avg(checkIns.map((entry) => entry.sleepQuality)),
    avgEnergy: avg(checkIns.map((entry) => entry.energy)),
    avgStress: avg(checkIns.map((entry) => entry.stress)),
    sleepHabitPct: averageCategoryCompletion(
      dateKeys,
      input.habits,
      input.customHabits,
      input.habitCompletions,
      'sleep',
    ),
    energyHabitPct: averageCategoryCompletion(
      dateKeys,
      input.habits,
      input.customHabits,
      input.habitCompletions,
      'energy',
    ),
    stressHabitPct: averageCategoryCompletion(
      dateKeys,
      input.habits,
      input.customHabits,
      input.habitCompletions,
      'stress',
    ),
    immunityHabitPct: averageCategoryCompletion(
      dateKeys,
      input.habits,
      input.customHabits,
      input.habitCompletions,
      'immunity',
    ),
    symptomDays,
    uniqueSymptoms,
    lowSleepDays: checkIns.filter((entry) => entry.sleepQuality <= 2).length,
    lowEnergyDays: checkIns.filter((entry) => entry.energy <= 2).length,
    highStressDays: checkIns.filter((entry) => entry.stress >= 4).length,
    avgSleepHours: avg(
      checkIns.map((entry) => estimatedSleepHoursFromQuality(entry.sleepQuality)),
    ),
  };
}

function body(text: string): SummarySegment {
  return { text, tone: 'body' };
}

function tone(text: string, toneKey: SummarySegment['tone']): SummarySegment {
  return { text, tone: toneKey };
}

function confidenceFromDays(daysTracked: number, windowDays: number): number {
  if (daysTracked === 0) return 42;
  return Math.min(92, 48 + Math.round((daysTracked / windowDays) * 44));
}

function habitFrequencyLabel(rate: number): string {
  if (rate >= 0.75) return 'done most days this week';
  if (rate >= 0.5) return 'inconsistent this week';
  if (rate > 0) return 'missed most days this week';
  return 'not logged yet this week';
}

function habitWeekStats(
  input: WeeklyInsightInput,
  dateKeys: string[],
  tag: MetricTag,
): HabitWeekStat[] {
  const linked = routineHabitsForMetric(input.habits, input.customHabits, tag);
  if (linked.length === 0 || dateKeys.length === 0) return [];
  return linked
    .map((habit) => {
      const completedDays = dateKeys.filter(
        (dateKey) => !!input.habitCompletions[dateKey]?.[habit.id],
      ).length;
      return {
        id: habit.id,
        title: habit.title,
        completionRate: completedDays / dateKeys.length,
      };
    })
    .sort((a, b) => a.completionRate - b.completionRate);
}

function friendlySuggestion(habit: HabitWeekStat): string {
  return (
    HABIT_SUGGESTIONS[habit.id] ??
    `When you can, come back to "${habit.title}" — small repeats across the week really add up.`
  );
}

function missedHabits(stats: HabitWeekStat[], threshold = 0.5): HabitWeekStat[] {
  return stats.filter((h) => h.completionRate < threshold);
}

function strongHabits(stats: HabitWeekStat[], threshold = 0.75): HabitWeekStat[] {
  return stats.filter((h) => h.completionRate >= threshold);
}

function habitSignalLines(stats: HabitWeekStat[]): string[] {
  if (stats.length === 0) return ['No linked habits in your routine yet'];
  return stats.map((h) => `${h.title}: ${habitFrequencyLabel(h.completionRate)}`);
}

function buildHabitActions(missed: HabitWeekStat[], fallback: HealthAction[]): HealthAction[] {
  if (missed.length === 0) return fallback.slice(0, 3);
  return missed.slice(0, 3).map((habit, index) => ({
    id: `focus-${habit.id}`,
    title: habit.title,
    description: friendlySuggestion(habit),
    duration: index === 0 ? 'Today' : 'This week',
    priority: (index + 1) as 1 | 2 | 3,
  }));
}

function joinNames(habits: HabitWeekStat[]): string {
  if (habits.length === 0) return 'your habits';
  if (habits.length === 1) return habits[0].title;
  if (habits.length === 2) return `${habits[0].title} and ${habits[1].title}`;
  return `${habits[0].title}, ${habits[1].title}, and others`;
}

function attentionSummary(
  categoryTone: SummarySegment['tone'],
  categoryLabel: string,
  missed: HabitWeekStat[],
  primarySuggestion: string,
): { summary: string; highlights: SummarySegment[] } {
  const names = joinNames(missed.slice(0, 2));
  const summary =
    missed.length > 0
      ? `Your ${categoryLabel} habits need a little extra care this week. ${names} ${missed.length === 1 ? 'has' : 'have'} been easy to skip — ${primarySuggestion}`
      : `Your ${categoryLabel} habits need attention this week. ${primarySuggestion}`;

  return {
    summary,
    highlights: [
      body('Your '),
      tone(`${categoryLabel} habits`, categoryTone),
      body(' need a little extra care this week. '),
      body(missed.length > 0 ? `${names} ${missed.length === 1 ? 'has' : 'have'} been easy to skip — ` : ''),
      body(primarySuggestion),
    ],
  };
}

function onTrackSummary(
  categoryTone: SummarySegment['tone'],
  categoryLabel: string,
  strong: HabitWeekStat[],
): { summary: string; highlights: SummarySegment[] } {
  const summary =
    strong.length > 0
      ? `Your ${categoryLabel} habits are on a good rhythm — especially ${strong[0].title}. Keep showing up this week.`
      : `Your ${categoryLabel} habits look steady this week. Nice work keeping your routine going.`;

  return {
    summary,
    highlights: [
      body('Your '),
      tone(`${categoryLabel} habits`, categoryTone),
      body(
        strong.length > 0
          ? ` are on a good rhythm — especially ${strong[0].title}. Keep showing up this week.`
          : ' look steady this week. Nice work keeping your routine going.',
      ),
    ],
  };
}

function sleepSeverity(stats: WeekInsightStats): InsightSeverity {
  if (stats.daysTracked === 0) return 'low';
  if (
    (stats.avgSleepQuality != null && stats.avgSleepQuality <= 2) ||
    stats.lowSleepDays >= 3 ||
    (stats.sleepHabitPct != null && stats.sleepHabitPct < 0.25)
  ) {
    return 'high';
  }
  if (
    (stats.avgSleepQuality != null && stats.avgSleepQuality <= 3) ||
    stats.lowSleepDays >= 2 ||
    (stats.sleepHabitPct != null && stats.sleepHabitPct < 0.5)
  ) {
    return 'medium';
  }
  return 'low';
}

function recoverySeverity(stats: WeekInsightStats): InsightSeverity {
  if (stats.daysTracked === 0) return 'low';
  if (
    (stats.avgEnergy != null && stats.avgEnergy <= 2) ||
    stats.lowEnergyDays >= 3 ||
    (stats.energyHabitPct != null && stats.energyHabitPct < 0.25)
  ) {
    return 'high';
  }
  if (
    (stats.avgEnergy != null && stats.avgEnergy <= 3) ||
    stats.lowEnergyDays >= 2 ||
    (stats.energyHabitPct != null && stats.energyHabitPct < 0.5)
  ) {
    return 'medium';
  }
  return 'low';
}

function stressSeverity(stats: WeekInsightStats): InsightSeverity {
  if (stats.daysTracked === 0) return 'low';
  if (
    (stats.avgStress != null && stats.avgStress >= 5) ||
    stats.highStressDays >= 3 ||
    (stats.stressHabitPct != null && stats.stressHabitPct < 0.25)
  ) {
    return 'high';
  }
  if (
    (stats.avgStress != null && stats.avgStress >= 4) ||
    stats.highStressDays >= 2 ||
    (stats.stressHabitPct != null && stats.stressHabitPct < 0.5)
  ) {
    return 'medium';
  }
  return 'low';
}

function immunitySeverity(stats: WeekInsightStats): InsightSeverity {
  if (stats.daysTracked === 0) return 'low';
  if (stats.symptomDays >= 3 || (stats.symptomDays >= 2 && stats.uniqueSymptoms.length >= 2)) {
    return 'high';
  }
  if (
    stats.symptomDays >= 1 ||
    (stats.immunityHabitPct != null && stats.immunityHabitPct < 0.5)
  ) {
    return 'medium';
  }
  return 'low';
}

function updateSleepInsight(
  insight: BodyInsight,
  stats: WeekInsightStats,
  input: WeeklyInsightInput,
): BodyInsight {
  if (stats.daysTracked === 0) {
    return {
      ...insight,
      title: 'Sleep habits — let’s get started',
      summary:
        'Mark sleep-related habits in your daily routine to unlock friendly sleep insights here.',
      summaryHighlights: [
        body('Mark '),
        tone('sleep habits', 'sleep'),
        body(' in your daily routine to unlock friendly sleep insights here.'),
      ],
      severity: 'low',
      confidence: confidenceFromDays(0, stats.windowDays),
      cause: {
        headline: 'Your routine is the starting point',
        detail:
          'We look at wind-down, sleep duration, morning light, and related habits from your past week — no percentages, just what helps you rest.',
        signals: ['Sleep habits: waiting for your first check-ins'],
      },
      effect: insight.effect,
      detectedAt: new Date().toISOString(),
    };
  }

  const habitStats = habitWeekStats(input, stats.dateKeys, 'sleep');
  const missed = missedHabits(habitStats);
  const strong = strongHabits(habitStats);
  const severity = sleepSeverity(stats);
  const needsAttention = severity !== 'low';
  const primary = missed[0] ?? habitStats[0];
  const primarySuggestion = primary
    ? friendlySuggestion(primary)
    : 'Pick one small habit today — consistency matters more than perfection.';
  const copy = needsAttention
    ? attentionSummary('sleep', 'sleep', missed, primarySuggestion)
    : onTrackSummary('sleep', 'sleep', strong);

  return {
    ...insight,
    title: needsAttention ? 'Your sleep habits need attention' : 'Sleep habits looking good',
    summary: copy.summary,
    summaryHighlights: copy.highlights,
    severity,
    confidence: confidenceFromDays(stats.daysTracked, stats.windowDays),
    cause: {
      headline: needsAttention ? 'Sleep habits slipped this week' : 'Sleep habits held steady',
      detail: needsAttention
        ? missed.length > 0
          ? `${joinNames(missed.slice(0, 2))} ${missed.length === 1 ? 'was' : 'were'} missed most days. Protecting wind-down and your ${SLEEP_TRACKING_TIMEFRAME} target makes the biggest difference.`
          : `Your sleep rhythm felt off this week. Small steps tonight — wind-down and a consistent bedtime — can help.`
        : `Your sleep-related habits stayed consistent this week. That supports recovery and steadier daytime energy.`,
      signals: habitSignalLines(habitStats),
    },
    effect: {
      ...insight.effect,
      detail: needsAttention
        ? stats.lowSleepDays >= 2
          ? 'When sleep habits slip, your body may run in conservation mode — foggy mornings and slower recovery are common signals.'
          : 'Catching sleep habit gaps early helps you reset before they stack into a tired week.'
        : 'Steady sleep habits help your body repair overnight and keep energy more predictable during the day.',
    },
    actions: buildHabitActions(missed, insight.actions),
    detectedAt: stats.checkIns[stats.checkIns.length - 1]?.date ?? new Date().toISOString(),
  };
}

function updateRecoveryInsight(
  insight: BodyInsight,
  stats: WeekInsightStats,
  input: WeeklyInsightInput,
): BodyInsight {
  if (stats.daysTracked === 0) {
    return {
      ...insight,
      title: 'Recovery habits — let’s get started',
      summary:
        'Complete energy-related habits in your routine to see how well your body is recovering.',
      summaryHighlights: [
        body('Complete '),
        tone('energy habits', 'recovery'),
        body(' in your routine to see how well your body is recovering.'),
      ],
      severity: 'low',
      confidence: confidenceFromDays(0, stats.windowDays),
      cause: {
        headline: 'Your routine is the starting point',
        detail:
          'Recovery insights come from hydration, movement, healthy meals, and other energy habits you check off each day.',
        signals: ['Energy habits: waiting for your first check-ins'],
      },
      effect: insight.effect,
      detectedAt: new Date().toISOString(),
    };
  }

  const habitStats = habitWeekStats(input, stats.dateKeys, 'energy');
  const missed = missedHabits(habitStats);
  const strong = strongHabits(habitStats);
  const severity = recoverySeverity(stats);
  const needsAttention = severity !== 'low';
  const primary = missed[0] ?? habitStats[0];
  const primarySuggestion = primary
    ? friendlySuggestion(primary)
    : 'Pick one small habit today — consistency matters more than perfection.';
  const copy = needsAttention
    ? attentionSummary('recovery', 'recovery', missed, primarySuggestion)
    : onTrackSummary('recovery', 'recovery', strong);

  return {
    ...insight,
    title: needsAttention ? 'Your recovery habits need attention' : 'Recovery habits looking good',
    summary: copy.summary,
    summaryHighlights: copy.highlights,
    severity,
    confidence: confidenceFromDays(stats.daysTracked, stats.windowDays),
    cause: {
      headline: needsAttention ? 'Recovery habits slipped this week' : 'Recovery habits held steady',
      detail: needsAttention
        ? missed.length > 0
          ? `${joinNames(missed.slice(0, 2))} ${missed.length === 1 ? 'was' : 'were'} missed most days. Hydration, movement, and nourishing food are simple levers when energy dips.`
          : `Your energy felt lower this week. One small recovery habit today — water, a walk, or a balanced meal — can help you bounce back.`
        : `Your energy-related habits stayed consistent this week. That gives your body a fair chance to recover between busy days.`,
      signals: habitSignalLines(habitStats),
    },
    effect: {
      ...insight.effect,
      detail: needsAttention
        ? stats.lowEnergyDays >= 2
          ? 'Several low-energy days suggest your body may still be catching up — gentler pacing and hydration help.'
          : 'When recovery habits slip, afternoon crashes and muscle soreness can linger longer than they need to.'
        : 'Steady recovery habits support clearer focus and help you bounce back after harder days.',
    },
    actions: buildHabitActions(missed, insight.actions),
    detectedAt: stats.checkIns[stats.checkIns.length - 1]?.date ?? new Date().toISOString(),
  };
}

function updateStressInsight(
  insight: BodyInsight,
  stats: WeekInsightStats,
  input: WeeklyInsightInput,
): BodyInsight {
  if (stats.daysTracked === 0) {
    return {
      ...insight,
      title: 'Stress habits — let’s get started',
      summary:
        'Log breathing, movement, and other stress habits to understand your weekly stress pattern.',
      summaryHighlights: [
        body('Log '),
        tone('stress habits', 'stress'),
        body(' to understand your weekly stress pattern.'),
      ],
      severity: 'low',
      confidence: confidenceFromDays(0, stats.windowDays),
      cause: {
        headline: 'Your routine is the starting point',
        detail:
          'Stress insights draw on breathing resets, movement breaks, and how you rated stress in daily check-ins.',
        signals: ['Stress habits: waiting for your first check-ins'],
      },
      effect: insight.effect,
      detectedAt: new Date().toISOString(),
    };
  }

  const habitStats = habitWeekStats(input, stats.dateKeys, 'stress');
  const missed = missedHabits(habitStats);
  const strong = strongHabits(habitStats);
  const severity = stressSeverity(stats);
  const needsAttention = severity !== 'low';
  const primary = missed[0] ?? habitStats[0];
  const primarySuggestion = primary
    ? friendlySuggestion(primary)
    : 'Pick one small habit today — consistency matters more than perfection.';
  const copy = needsAttention
    ? attentionSummary('stress', 'stress', missed, primarySuggestion)
    : onTrackSummary('stress', 'stress', strong);

  return {
    ...insight,
    title: needsAttention ? 'Your stress habits need attention' : 'Stress habits looking good',
    summary: copy.summary,
    summaryHighlights: copy.highlights,
    severity,
    confidence: confidenceFromDays(stats.daysTracked, stats.windowDays),
    cause: {
      headline: needsAttention ? 'Stress habits slipped this week' : 'Stress habits held steady',
      detail: needsAttention
        ? missed.length > 0
          ? `${joinNames(missed.slice(0, 2))} ${missed.length === 1 ? 'was' : 'were'} missed most days. Short breathing breaks and movement help your nervous system downshift.`
          : `Stress felt elevated this week. A one-minute breathing reset or a brief walk can take the edge off today.`
        : `Your stress-support habits stayed consistent this week. That helps sleep onset and how recovered you feel.`,
      signals: habitSignalLines(habitStats),
    },
    effect: {
      ...insight.effect,
      detail: needsAttention
        ? stats.highStressDays >= 2
          ? 'Several high-stress days can spill into sleep and digestion — small breaks during the day matter.'
          : 'When stress habits slip, tension headaches and racing thoughts at bedtime become more likely.'
        : 'Manageable stress habits mean your body has more room to rest and digest overnight.',
    },
    actions: buildHabitActions(missed, insight.actions),
    detectedAt: stats.checkIns[stats.checkIns.length - 1]?.date ?? new Date().toISOString(),
  };
}

function updateImmunityInsight(
  insight: BodyInsight,
  stats: WeekInsightStats,
  input: WeeklyInsightInput,
): BodyInsight {
  if (stats.daysTracked === 0) {
    return {
      ...insight,
      title: 'Prevention habits — let’s get started',
      summary:
        'Log symptoms and prevention habits in your routine to catch early warning signs early.',
      summaryHighlights: [
        body('Log '),
        tone('symptoms', 'immunity'),
        body(' and prevention habits in your routine to catch early warning signs early.'),
      ],
      severity: 'low',
      confidence: confidenceFromDays(0, stats.windowDays),
      cause: {
        headline: 'Your routine is the starting point',
        detail:
          'Prevention insights combine symptoms you log with hydration, evening check-ins, and related habits.',
        signals: ['Prevention habits: waiting for your first check-ins'],
      },
      effect: insight.effect,
      detectedAt: new Date().toISOString(),
    };
  }

  const habitStats = habitWeekStats(input, stats.dateKeys, 'immunity');
  const missed = missedHabits(habitStats);
  const strong = strongHabits(habitStats);
  const severity = immunitySeverity(stats);
  const needsAttention = severity !== 'low';
  const symptomSummary =
    stats.uniqueSymptoms.length > 0 ? stats.uniqueSymptoms.join(', ') : 'none reported';
  const primary = missed[0] ?? habitStats[0];
  const primarySuggestion = primary
    ? friendlySuggestion(primary)
    : 'Extra rest and hydration today give your body room to recover.';

  let copy: { summary: string; highlights: SummarySegment[] };
  if (stats.symptomDays > 0) {
    copy = {
      summary: `You logged symptoms this week (${symptomSummary}). Your prevention habits need extra care — ${primarySuggestion}`,
      highlights: [
        body('You logged '),
        tone('symptoms', 'immunity'),
        body(` this week (${symptomSummary}). Your prevention habits need extra care — `),
        body(primarySuggestion),
      ],
    };
  } else if (needsAttention) {
    copy = attentionSummary('immunity', 'prevention', missed, primarySuggestion);
  } else {
    copy = onTrackSummary('immunity', 'prevention', strong);
  }

  return {
    ...insight,
    title: needsAttention
      ? stats.symptomDays > 0
        ? 'Symptoms logged — prevention habits need attention'
        : 'Your prevention habits need attention'
      : 'Prevention habits looking good',
    summary: copy.summary,
    summaryHighlights: copy.highlights,
    severity,
    confidence: confidenceFromDays(stats.daysTracked, stats.windowDays),
    cause: {
      headline:
        stats.symptomDays > 0 ? 'Symptoms showed up this week' : needsAttention
          ? 'Prevention habits slipped this week'
          : 'Prevention habits held steady',
      detail:
        stats.symptomDays > 0
          ? `You reported ${symptomSummary} on ${stats.symptomDays} day${stats.symptomDays === 1 ? '' : 's'}. Extra rest, hydration, and your evening check-in help you respond early.`
          : needsAttention
            ? missed.length > 0
              ? `${joinNames(missed.slice(0, 2))} ${missed.length === 1 ? 'was' : 'were'} missed most days. Steady prevention habits make it easier to spot when something is off.`
              : `Your prevention routine could use a boost this week — small daily habits build resilience over time.`
            : `No symptoms this week and steady prevention habits support early detection and recovery.`,
      signals: [
        stats.symptomDays > 0
          ? `Symptoms: ${symptomSummary}`
          : 'Symptoms: none logged this week',
        ...habitSignalLines(habitStats),
      ],
    },
    effect: {
      ...insight.effect,
      detail:
        stats.symptomDays > 0
          ? 'Logged symptoms are your body asking for support — rest and hydration beat pushing through.'
          : needsAttention
            ? 'When prevention habits slip, minor symptoms can linger longer than they need to.'
            : 'No symptoms and steady habits mean your body has room to stay resilient.',
    },
    actions: buildHabitActions(missed, insight.actions),
    detectedAt: stats.checkIns[stats.checkIns.length - 1]?.date ?? new Date().toISOString(),
  };
}

const INSIGHT_UPDATERS: Record<
  string,
  (insight: BodyInsight, stats: WeekInsightStats, input: WeeklyInsightInput) => BodyInsight
> = {
  'sleep-debt-1': updateSleepInsight,
  'hrv-dip-1': updateRecoveryInsight,
  'immunity-watch-1': updateImmunityInsight,
  'stress-elevated-1': updateStressInsight,
};

export function applyWeeklyDataToInsights(
  base: BodyInsight[],
  input: WeeklyInsightInput,
): BodyInsight[] {
  const stats = computeWeekInsightStats(input);

  return base.map((insight) => {
    const updater = INSIGHT_UPDATERS[insight.id];
    if (!updater) return insight;
    return updater(insight, stats, input);
  });
}
