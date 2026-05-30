import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { AdaptivePlan, PlanWeek, planDisplayTitle } from '@/types/plan';

type Props = {
  plan: AdaptivePlan;
  week: PlanWeek;
  showIntro?: boolean;
};

/** User-facing plan copy only — no experiments, check-in schema, or app internals. */
export default function ActivePlanCard({ plan, week, showIntro = true }: Props) {
  return (
    <View style={styles.card}>
      {showIntro && (
        <>
          <Text style={styles.heading}>{planDisplayTitle(plan)}</Text>
          <Text style={styles.summary}>{plan.goalSummary}</Text>
          <Text style={styles.body}>{plan.baselineSummary}</Text>
          <Text style={styles.outcome}>{plan.desiredOutcome}</Text>
        </>
      )}

      <View style={styles.weekBlock}>
        <Text style={styles.weekLabel}>Week {week.weekNumber}</Text>
        <Text style={styles.focus}>{week.focus}</Text>
        <Text style={styles.weeklyTarget}>{week.weeklyTarget}</Text>
        <Text style={styles.planForWeek}>{week.planForTheWeek}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 12,
    width: '100%',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.slate,
  },
  summary: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.slate,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  outcome: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slate,
  },
  weekBlock: {
    gap: 8,
    marginTop: 4,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  focus: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.slate,
    lineHeight: 26,
  },
  weeklyTarget: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.slate,
  },
  planForWeek: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
});
