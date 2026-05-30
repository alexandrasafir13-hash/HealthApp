import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { AdaptivePlan, planDisplayTitle } from '@/types/plan';

type Props = {
  plan: AdaptivePlan;
  activeWeekNumber?: number;
  showIntro?: boolean;
};

/** User-facing plan copy only — no experiments, check-in schema, or app internals. */
export default function ActivePlanCard({
  plan,
  activeWeekNumber = 1,
  showIntro = true,
}: Props) {
  const weeks = [...plan.weeks].sort((a, b) => a.weekNumber - b.weekNumber);

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

      <View style={styles.weekList}>
        {weeks.map((week) => {
          const isActive = week.weekNumber === activeWeekNumber;
          return (
            <View
              key={week.weekNumber}
              style={[styles.weekBlock, isActive && styles.weekBlockActive]}>
              <Text style={[styles.weekLabel, isActive && styles.weekLabelActive]}>
                Week {week.weekNumber}
                {isActive ? ' · Now' : ''}
              </Text>
              <Text style={styles.focus}>{week.focus}</Text>
              <Text style={styles.weeklyTarget}>{week.weeklyTarget}</Text>
              {week.whyThisWeek ? <Text style={styles.whyThisWeek}>{week.whyThisWeek}</Text> : null}
              {week.planSteps.length > 0 ? (
                <View style={styles.stepsList}>
                  {week.planSteps.map((step) => (
                    <Text key={step} style={styles.planStep}>
                      • {step}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.planForWeek}>{week.planForTheWeek}</Text>
              )}
            </View>
          );
        })}
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
  weekList: {
    gap: 12,
    marginTop: 4,
  },
  weekBlock: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
  },
  weekBlockActive: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slateMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  weekLabelActive: {
    color: palette.teal,
  },
  focus: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
    lineHeight: 24,
  },
  weeklyTarget: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.slate,
  },
  whyThisWeek: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  stepsList: {
    gap: 6,
  },
  planStep: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slate,
  },
  planForWeek: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
});
