import { StyleSheet, Text, View } from 'react-native';

import { metricScaleColors, palette } from '@/constants/theme';
import { HealthSnapshot } from '@/lib/healthSnapshot';

interface Props {
  snapshot: HealthSnapshot;
  name?: string;
}

function bmiAccent(category: HealthSnapshot['bmiCategory']) {
  if (category === 'healthy') return metricScaleColors.good;
  if (category === 'obese') return metricScaleColors.action;
  return metricScaleColors.caution;
}

function Stat({ label, value, detail, accent }: { label: string; value: string; detail?: string; accent?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent != null && { color: accent }]}>{value}</Text>
      {detail != null && <Text style={styles.statDetail}>{detail}</Text>}
    </View>
  );
}

export default function HealthSnapshotCard({ snapshot, name }: Props) {
  const firstName = name?.trim().split(/\s+/)[0];
  const accent = bmiAccent(snapshot.bmiCategory);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your health snapshot</Text>
      <Text style={styles.subtitle}>
        {firstName
          ? `${firstName}, here’s a starting point from your profile.`
          : 'A starting point from your height, weight, and age.'}
      </Text>

      <View style={styles.grid}>
        <Stat
          label="BMI"
          value={String(snapshot.bmi)}
          detail={snapshot.bmiLabel}
          accent={accent}
        />
        <Stat
          label="Healthy weight"
          value={`${snapshot.healthyWeightMinKg}–${snapshot.healthyWeightMaxKg} kg`}
          detail="For your height"
        />
        <Stat
          label="Water goal"
          value={`~${snapshot.dailyWaterLiters} L`}
          detail="Suggested daily intake"
        />
        <Stat
          label="Resting calories"
          value={`~${snapshot.restingCalories.toLocaleString()} kcal`}
          detail="Energy at rest each day"
        />
        <Stat
          label="Sleep"
          value={`${snapshot.sleepMinHours}–${snapshot.sleepMaxHours} h`}
          detail="Recommended per night for your age"
        />
      </View>

      <Text style={styles.footer}>
        These are estimates — not medical advice. Update your profile if your weight changes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: palette.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slateMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.slate,
    marginBottom: 2,
  },
  statDetail: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.slateSubtle,
  },
  footer: {
    fontSize: 12,
    lineHeight: 17,
    color: palette.slateSubtle,
    marginTop: 12,
  },
});
