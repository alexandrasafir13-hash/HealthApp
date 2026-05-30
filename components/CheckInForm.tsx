import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import CheckInMetricRow from '@/components/CheckInMetricRow';
import { Text } from '@/components/Themed';
import {
  SLEEP_TRACKING_TIMEFRAME,
  WEEKLY_HABIT_TRACKING_LABEL,
} from '@/lib/deriveWeeklyInsights';
import { deriveRoutineMetrics, routineHabitsForMetric } from '@/lib/deriveCheckInFromRoutine';
import { formatRoutineMetricsSummary } from '@/lib/deriveInsightsFromCheckIn';
import { palette } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';

interface Props {
  selectedDate: string;
}

export default function CheckInForm({ selectedDate }: Props) {
  const { getHabitsForDate, isReady } = useHealth();

  const { habits, customHabits, completed, total } = useMemo(
    () => getHabitsForDate(selectedDate),
    [getHabitsForDate, selectedDate],
  );

  const checkIn = useMemo(() => {
    const hasActivity = total > 0 && [...habits, ...customHabits].some((h) => h.completed);
    if (!hasActivity) return null;
    return deriveRoutineMetrics(habits, customHabits);
  }, [habits, customHabits, total]);

  if (!isReady) return null;

  const completedCount = completed;
  const totalCount = total;
  const hasMetrics = checkIn != null;

  const metricHints = [
    {
      tag: 'energy' as const,
      label: 'Recovery habits',
      timeframe: `${WEEKLY_HABIT_TRACKING_LABEL} · daily check-ins`,
    },
    {
      tag: 'sleep' as const,
      label: 'Sleep habits',
      timeframe: `${SLEEP_TRACKING_TIMEFRAME} · ${WEEKLY_HABIT_TRACKING_LABEL.toLowerCase()}`,
    },
    {
      tag: 'stress' as const,
      label: 'Stress habits',
      timeframe: `${WEEKLY_HABIT_TRACKING_LABEL} · daily check-ins`,
    },
  ];

  if (!hasMetrics) {
    return (
      <Text style={styles.intro}>
        Mark habits above to update energy, sleep, and stress. Log symptoms in the section above.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Energy, sleep, and stress from your routine checks ({completedCount} of {totalCount}{' '}
        complete). Symptoms are logged separately above.
      </Text>

      <Text style={styles.summary}>
        {formatRoutineMetricsSummary({
          ...checkIn,
          symptoms: ['None'],
          date: selectedDate,
        })}
      </Text>

      <CheckInMetricRow label="Energy (today)" value={checkIn.energy} readOnly />
      <CheckInMetricRow
        label={`Sleep quality (last night · ${SLEEP_TRACKING_TIMEFRAME})`}
        value={checkIn.sleepQuality}
        readOnly
      />
      <CheckInMetricRow label="Stress (today)" value={checkIn.stress} lowerIsBetter readOnly />

      <View style={styles.habitMap}>
        <Text style={styles.habitMapTitle}>Habits that shape energy, sleep & stress</Text>
        {metricHints.map(({ tag, label, timeframe }) => {
          const linked = routineHabitsForMetric(habits, customHabits, tag);
          if (linked.length === 0) return null;
          return (
            <View key={tag} style={styles.habitMapRow}>
              <Text style={styles.habitMapLabel}>{label}</Text>
              <Text style={styles.habitMapTimeframe}>{timeframe}</Text>
              <Text style={styles.habitMapValue}>
                {linked.map((h) => `${h.title}${h.completed ? ' ✓' : ''}`).join(' · ')}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.savedNote}>
        Today tab priorities use your routine checks and symptoms together.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 12,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slate,
    marginBottom: 8,
  },
  habitMap: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
    marginBottom: 8,
  },
  habitMapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate,
  },
  habitMapRow: {
    gap: 4,
  },
  habitMapLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  habitMapTimeframe: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.slateMuted,
    marginBottom: 2,
  },
  habitMapValue: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
  savedNote: {
    fontSize: 13,
    textAlign: 'center',
    color: palette.slateSubtle,
    marginTop: 8,
  },
});
