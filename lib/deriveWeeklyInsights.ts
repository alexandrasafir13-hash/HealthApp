import { habitCatalog } from '@/data/onboardingOptions';
import { CheckInLog } from '@/lib/checkInStorage';
import {
  CHECK_IN_PERIODS,
  CheckInPeriod,
  normalizeDailyCheckIn,
  periodFeeling,
  periodFeelingValue,
  resolveDailyMetricsFromPeriods,
} from '@/lib/checkInPeriod';
import { hasReportedSymptoms } from '@/lib/deriveInsightsFromCheckIn';
import { addDaysToDateKey, compareDateKeys } from '@/lib/dateKeys';
import { localDateKey } from '@/lib/localDate';
import { RoutineCompletionLog } from '@/lib/routineCompletionStorage';
import { normalizePersonalRoutine } from '@/lib/routineSteps';
import {
  BodyInsight,
  DailyCheckIn,
  HealthAction,
  InsightSeverity,
  SummarySegment,
} from '@/types/health';
import { PersonalRoutine } from '@/types/routine';

const WINDOW_DAYS = 7;

const GOAL_TIPS: Record<string, string> = {
  'sleep-schedule': 'Pick a bedtime you can repeat tonight — consistency helps you wake up rested.',
  'exercise-routine': 'Even a short walk or stretch counts — small movement today adds up.',
  'eating-habits': 'One nourishing meal today gives your body steady fuel.',
  hydration: 'Keep water within reach — small sips through the day support recovery.',
  'screen-time': 'Try 15 minutes without screens before bed — it can help you feel less tired tomorrow.',
};

export interface WeeklyInsightInput {
  checkInLog: CheckInLog;
  routineCompletionLog?: RoutineCompletionLog;
  personalRoutine?: PersonalRoutine | null;
  accountStartDate: string;
  goalIds?: string[];
  todayKey?: string;
}

export interface WeekInsightStats {
  windowDays: number;
  dateKeys: string[];
  checkIns: DailyCheckIn[];
  daysTracked: number;
  morningCheckIns: number;
  afternoonCheckIns: number;
  eveningCheckIns: number;
  lowSleepDays: number;
  lowEnergyDays: number;
  highStressDays: number;
  symptomDays: number;
  uniqueSymptoms: string[];
  routineDaysTracked: number;
  routineDaysFinished: number;
  routineCompletionRate: number;
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

export function buildCheckInForDate(dateKey: string, checkInLog: CheckInLog): DailyCheckIn | null {
  const logged = checkInLog[dateKey];
  if (!logged) return null;
  const normalized = normalizeDailyCheckIn({ ...logged, date: dateKey });
  const hasPeriods = CHECK_IN_PERIODS.some((p) => periodFeeling(normalized, p) != null);
  const hasSymptoms = hasReportedSymptoms(normalized);
  if (!hasPeriods && !hasSymptoms) return null;
  return { ...normalized, ...resolveDailyMetricsFromPeriods(normalized), date: dateKey };
}

function countPeriodCheckIns(checkInLog: CheckInLog, dateKeys: string[], period: CheckInPeriod): number {
  return dateKeys.filter((dateKey) => {
    const entry = checkInLog[dateKey];
    return entry && periodFeeling(entry, period) != null;
  }).length;
}

function computeRoutineStats(
  routineLog: RoutineCompletionLog | undefined,
  personalRoutine: PersonalRoutine | null | undefined,
  dateKeys: string[],
): Pick<WeekInsightStats, 'routineDaysTracked' | 'routineDaysFinished' | 'routineCompletionRate'> {
  if (!routineLog || !personalRoutine) {
    return { routineDaysTracked: 0, routineDaysFinished: 0, routineCompletionRate: 0 };
  }

  const routine = normalizePersonalRoutine(personalRoutine);
  const stepCount = routine.steps.length;
  if (stepCount === 0) {
    return { routineDaysTracked: 0, routineDaysFinished: 0, routineCompletionRate: 0 };
  }

  let tracked = 0;
  let finished = 0;
  let totalCompleted = 0;

  for (const dateKey of dateKeys) {
    const progress = routineLog[dateKey];
    if (!progress || Object.keys(progress.steps).length === 0) continue;
    tracked += 1;
    const completed = Object.values(progress.steps).filter(Boolean).length;
    totalCompleted += completed / stepCount;
    if (progress.finishedAt) finished += 1;
  }

  return {
    routineDaysTracked: tracked,
    routineDaysFinished: finished,
    routineCompletionRate: tracked > 0 ? totalCompleted / tracked : 0,
  };
}

export function computeWeekInsightStats(input: WeeklyInsightInput): WeekInsightStats {
  const todayKey = input.todayKey ?? localDateKey();
  const dateKeys = getPastWeekDateKeys(todayKey, input.accountStartDate);
  const checkIns = dateKeys
    .map((dateKey) => buildCheckInForDate(dateKey, input.checkInLog))
    .filter((entry): entry is DailyCheckIn => entry != null);

  const symptomDays = checkIns.filter((entry) => hasReportedSymptoms(entry)).length;
  const uniqueSymptoms = [
    ...new Set(checkIns.flatMap((entry) => entry.symptoms.filter((s) => s !== 'None'))),
  ];

  const routineStats = computeRoutineStats(
    input.routineCompletionLog,
    input.personalRoutine,
    dateKeys,
  );

  return {
    windowDays: dateKeys.length,
    dateKeys,
    checkIns,
    daysTracked: Math.max(checkIns.length, routineStats.routineDaysFinished),
    morningCheckIns: countPeriodCheckIns(input.checkInLog, dateKeys, 'morning'),
    afternoonCheckIns: countPeriodCheckIns(input.checkInLog, dateKeys, 'afternoon'),
    eveningCheckIns: countPeriodCheckIns(input.checkInLog, dateKeys, 'evening'),
    lowSleepDays: dateKeys.filter((dateKey) => {
      const v = periodFeelingValue(input.checkInLog[dateKey], 'morning');
      return v != null && v <= 2;
    }).length,
    lowEnergyDays: dateKeys.filter((dateKey) => {
      const v = periodFeelingValue(input.checkInLog[dateKey], 'afternoon');
      return v != null && v <= 2;
    }).length,
    highStressDays: dateKeys.filter((dateKey) => {
      const v = periodFeelingValue(input.checkInLog[dateKey], 'evening');
      return v != null && v <= 2;
    }).length,
    symptomDays,
    uniqueSymptoms,
    ...routineStats,
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

function buildGoalActions(goalIds: string[], fallback: HealthAction[]): HealthAction[] {
  if (goalIds.length === 0) return fallback.slice(0, 3);
  return goalIds.slice(0, 3).map((id, index) => {
    const goal = habitCatalog.find((g) => g.id === id);
    return {
      id: `goal-${id}`,
      title: goal?.title ?? id,
      description:
        GOAL_TIPS[id] ??
        goal?.reason ??
        'Pick one small step today that supports this goal.',
      duration: index === 0 ? 'Today' : 'This week',
      priority: (index + 1) as 1 | 2 | 3,
    };
  });
}

function sleepSeverity(stats: WeekInsightStats): InsightSeverity {
  if (stats.morningCheckIns === 0) return 'low';
  if (stats.lowSleepDays >= 3) return 'high';
  if (stats.lowSleepDays >= 2) return 'medium';
  return 'low';
}

function recoverySeverity(stats: WeekInsightStats): InsightSeverity {
  if (stats.afternoonCheckIns === 0) return 'low';
  if (stats.lowEnergyDays >= 3) return 'high';
  if (stats.lowEnergyDays >= 2) return 'medium';
  return 'low';
}

function stressSeverity(stats: WeekInsightStats): InsightSeverity {
  if (stats.eveningCheckIns === 0) return 'low';
  if (stats.highStressDays >= 3) return 'high';
  if (stats.highStressDays >= 2) return 'medium';
  return 'low';
}

function immunitySeverity(stats: WeekInsightStats): InsightSeverity {
  if (stats.symptomDays >= 3 || (stats.symptomDays >= 2 && stats.uniqueSymptoms.length >= 2)) {
    return 'high';
  }
  if (stats.symptomDays >= 1) return 'medium';
  return 'low';
}

function updateSleepInsight(
  insight: BodyInsight,
  stats: WeekInsightStats,
  goalIds: string[],
): BodyInsight {
  if (stats.morningCheckIns === 0 && stats.routineDaysFinished === 0) {
    return {
      ...insight,
      title: 'Sleep — track your routine',
      summary: 'Tick off your daily routine on the Today tab to unlock sleep insights here.',
      summaryHighlights: [
        body('Tick off your '),
        tone('daily routine', 'sleep'),
        body(' on the Today tab to unlock sleep insights here.'),
      ],
      severity: 'low',
      confidence: confidenceFromDays(0, stats.windowDays),
      cause: {
        headline: 'Your routine is the starting point',
        detail:
          'Completing sleep-related items in your routine helps us spot patterns over a few days.',
        signals: ['Routine days finished: none yet this week'],
      },
      effect: insight.effect,
      detectedAt: new Date().toISOString(),
    };
  }

  const severity = sleepSeverity(stats);
  const needsAttention = severity !== 'low';

  return {
    ...insight,
    title: needsAttention ? 'Sleep has been rough this week' : 'Sleep looks steady this week',
    summary: needsAttention
      ? `You logged Weak or Drained on ${stats.lowSleepDays} morning${stats.lowSleepDays === 1 ? '' : 's'} — rest and a steady bedtime can help.`
      : 'Your morning check-ins suggest sleep has been okay this week. Keep noting how you wake up.',
    summaryHighlights: needsAttention
      ? [
          body('You logged '),
          tone('Weak or Drained', 'sleep'),
          body(` on ${stats.lowSleepDays} morning${stats.lowSleepDays === 1 ? '' : 's'} — rest and a steady bedtime can help.`),
        ]
      : [
          body('Your '),
          tone('morning check-ins', 'sleep'),
          body(' suggest sleep has been okay this week.'),
        ],
    severity,
    confidence: confidenceFromDays(stats.morningCheckIns, stats.windowDays),
    cause: {
      headline: needsAttention ? 'Sleep felt off on several mornings' : 'Mornings look steadier',
      detail: needsAttention
        ? 'When you wake feeling Weak or Drained repeatedly, your body may be asking for more rest.'
        : 'Most mornings you checked in with Steady or better — a sign sleep is supporting you.',
      signals: [`Morning check-ins logged: ${stats.morningCheckIns} of ${stats.windowDays} days`],
    },
    effect: {
      ...insight.effect,
      detail: needsAttention
        ? 'Poor sleep often shows up as foggy mornings and slower recovery through the day.'
        : 'Better sleep supports clearer focus and steadier energy in the afternoon.',
    },
    actions: buildGoalActions(goalIds.filter((id) => id.includes('sleep') || id === 'screen-time'), insight.actions),
    detectedAt: stats.checkIns[stats.checkIns.length - 1]?.date ?? new Date().toISOString(),
  };
}

function updateRecoveryInsight(
  insight: BodyInsight,
  stats: WeekInsightStats,
  goalIds: string[],
): BodyInsight {
  if (stats.afternoonCheckIns === 0 && stats.routineDaysFinished === 0) {
    return {
      ...insight,
      title: 'Recovery — track your routine',
      summary: 'Tick off your daily routine on Today to see how consistently you are showing up.',
      summaryHighlights: [
        body('Tick off your '),
        tone('daily routine', 'recovery'),
        body(' on Today to see how consistently you are showing up.'),
      ],
      severity: 'low',
      confidence: confidenceFromDays(0, stats.windowDays),
      cause: {
        headline: 'Routine completion tells the recovery story',
        detail: 'Steady daily habits support how well your body recovers over time.',
        signals: ['Routine days finished: none yet this week'],
      },
      effect: insight.effect,
      detectedAt: new Date().toISOString(),
    };
  }

  const severity = recoverySeverity(stats);
  const needsAttention = severity !== 'low';

  return {
    ...insight,
    title: needsAttention ? 'Energy dipped this week' : 'Recovery looks on track',
    summary: needsAttention
      ? `Afternoon check-ins were Weak or Drained ${stats.lowEnergyDays} time${stats.lowEnergyDays === 1 ? '' : 's'} — hydration and movement can help.`
      : 'Your afternoon check-ins suggest your body is recovering reasonably well this week.',
    severity,
    confidence: confidenceFromDays(stats.afternoonCheckIns, stats.windowDays),
    cause: {
      headline: needsAttention ? 'Afternoon energy ran low' : 'Afternoon energy held up',
      detail: needsAttention
        ? 'Repeated low afternoon scores often mean your body needs more recovery between demands.'
        : 'Steady afternoon check-ins mean you are bouncing back from busy mornings.',
      signals: [`Afternoon check-ins logged: ${stats.afternoonCheckIns} of ${stats.windowDays} days`],
    },
    effect: insight.effect,
    actions: buildGoalActions(
      goalIds.filter((id) => ['hydration', 'exercise-routine', 'eating-habits', 'movement'].includes(id)),
      insight.actions,
    ),
    detectedAt: stats.checkIns[stats.checkIns.length - 1]?.date ?? new Date().toISOString(),
  };
}

function updateStressInsight(
  insight: BodyInsight,
  stats: WeekInsightStats,
  goalIds: string[],
): BodyInsight {
  if (stats.eveningCheckIns === 0 && stats.routineDaysFinished === 0) {
    return {
      ...insight,
      title: 'Stress — track your routine',
      summary: 'Tick off your daily routine on Today to build a picture of your weekly habits.',
      summaryHighlights: [
        body('Tick off your '),
        tone('daily routine', 'stress'),
        body(' on Today to build a picture of your weekly habits.'),
      ],
      severity: 'low',
      confidence: confidenceFromDays(0, stats.windowDays),
      cause: {
        headline: 'Daily habits shape stress over time',
        detail: 'Consistent wind-down and movement items in your routine support lower stress.',
        signals: ['Routine days finished: none yet this week'],
      },
      effect: insight.effect,
      detectedAt: new Date().toISOString(),
    };
  }

  const severity = stressSeverity(stats);
  const needsAttention = severity !== 'low';

  return {
    ...insight,
    title: needsAttention ? 'Evenings felt heavy this week' : 'Evenings look manageable',
    summary: needsAttention
      ? `You logged Weak or Drained ${stats.highStressDays} evening${stats.highStressDays === 1 ? '' : 's'} — wind-down time may help.`
      : 'Your evening check-ins suggest stress stayed manageable most nights this week.',
    severity,
    confidence: confidenceFromDays(stats.eveningCheckIns, stats.windowDays),
    cause: {
      headline: needsAttention ? 'Evenings carried extra weight' : 'Evenings stayed calmer',
      detail: needsAttention
        ? 'When evenings repeatedly feel Weak or Drained, your nervous system may need more downtime.'
        : 'Steadier evening check-ins often mean your body had room to decompress.',
      signals: [`Evening check-ins logged: ${stats.eveningCheckIns} of ${stats.windowDays} days`],
    },
    effect: insight.effect,
    actions: buildGoalActions(goalIds, insight.actions),
    detectedAt: stats.checkIns[stats.checkIns.length - 1]?.date ?? new Date().toISOString(),
  };
}

function updateImmunityInsight(
  insight: BodyInsight,
  stats: WeekInsightStats,
  goalIds: string[],
): BodyInsight {
  const symptomSummary =
    stats.uniqueSymptoms.length > 0 ? stats.uniqueSymptoms.slice(0, 3).join(', ') : 'symptoms';

  if (stats.daysTracked === 0) {
    return {
      ...insight,
      title: 'Prevention — log how you feel',
      summary: 'Check in on Today and note any symptoms to catch early warning signs.',
      severity: 'low',
      confidence: confidenceFromDays(0, stats.windowDays),
      cause: {
        headline: 'Symptoms plus check-ins build the picture',
        detail: 'Evening check-ins and symptom logs help spot patterns before they grow.',
        signals: ['Check-ins: waiting for your first entries'],
      },
      effect: insight.effect,
      detectedAt: new Date().toISOString(),
    };
  }

  const severity = immunitySeverity(stats);
  const needsAttention = severity !== 'low';

  return {
    ...insight,
    title: needsAttention ? 'Symptoms showed up this week' : 'No concerning symptom pattern',
    summary: needsAttention
      ? `You logged symptoms on ${stats.symptomDays} day${stats.symptomDays === 1 ? '' : 's'} (${symptomSummary}). Rest and hydration matter.`
      : 'No symptoms logged this week — keep checking in so you notice changes early.',
    severity,
    confidence: confidenceFromDays(stats.daysTracked, stats.windowDays),
    cause: {
      headline: needsAttention ? 'Symptoms appeared this week' : 'Symptoms stayed quiet',
      detail: needsAttention
        ? 'Tracking symptoms alongside your goals helps you respond before things escalate.'
        : 'A symptom-free week is a good sign — consistency with check-ins keeps you ahead of problems.',
      signals: [
        stats.symptomDays > 0
          ? `Symptom days: ${stats.symptomDays}`
          : 'No symptoms logged this week',
      ],
    },
    effect: insight.effect,
    actions: buildGoalActions(goalIds, insight.actions),
    detectedAt: stats.checkIns[stats.checkIns.length - 1]?.date ?? new Date().toISOString(),
  };
}

const INSIGHT_UPDATERS: Record<
  string,
  (insight: BodyInsight, stats: WeekInsightStats, goalIds: string[]) => BodyInsight
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
  const goalIds = input.goalIds ?? [];

  return base.map((insight) => {
    const updater = INSIGHT_UPDATERS[insight.id];
    if (!updater) return insight;
    return updater(insight, stats, goalIds);
  });
}
