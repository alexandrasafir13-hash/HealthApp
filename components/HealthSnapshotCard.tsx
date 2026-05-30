import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { metricScaleColors, palette } from '@/constants/theme';
import { HealthSnapshot } from '@/lib/healthSnapshot';

interface Props {
  snapshot: HealthSnapshot;
  name?: string;
}

function bmiAccent(category: HealthSnapshot['profile']['bmiCategory']) {
  if (category === 'healthy') return metricScaleColors.good;
  if (category === 'obese') return metricScaleColors.action;
  return metricScaleColors.caution;
}

function weightBandAccent(status: HealthSnapshot['profile']['weightBandStatus']) {
  if (status === 'within') return metricScaleColors.good;
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

export default function HealthSnapshotCard({ snapshot, name }: Props) {
  const firstName = name?.trim().split(/\s+/)[0];
  const { profile, recommendations } = snapshot;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Your health snapshot</Text>
      <Text style={styles.intro}>
        {firstName
          ? `${firstName}, here’s what we calculated from your profile.`
          : 'Here’s what we calculated from your profile.'}
      </Text>

      <Section
        title="From your profile"
        subtitle="Numbers calculated from your height, weight, age, and sex.">
        <Stat
          label="BMI"
          value={String(profile.bmi)}
          detail={profile.bmiLabel}
          accent={bmiAccent(profile.bmiCategory)}
        />
        <Stat
          label="Your weight"
          value={`${profile.weightKg} kg`}
          detail={profile.weightBandDetail}
          accent={weightBandAccent(profile.weightBandStatus)}
        />
        <Stat
          label="Healthy weight"
          value={`${profile.healthyWeightMinKg}–${profile.healthyWeightMaxKg} kg`}
          detail="Range for your height"
        />
        <Stat
          label="Resting calories"
          value={`${profile.restingCalories.toLocaleString()} kcal`}
          detail="Energy your body uses at rest"
        />
      </Section>

      <Section
        title="Recommendations"
        subtitle="General targets based on your profile — not medical advice.">
        <Stat
          label="Daily calories"
          value={`~${recommendations.activeCalorieMin.toLocaleString()}–${recommendations.activeCalorieMax.toLocaleString()}`}
          detail="With light activity"
        />
        <Stat
          label="Water"
          value={`~${recommendations.dailyWaterLiters} L`}
          detail="Suggested daily intake"
        />
        <Stat
          label="Sleep"
          value={`${recommendations.sleepMinHours}–${recommendations.sleepMaxHours} h`}
          detail="Per night for your age"
        />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
    marginBottom: 4,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 4,
  },
  section: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
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
});
