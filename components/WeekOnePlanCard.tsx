import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import { palette, radii, spacing, typography, cardShadow } from '@/constants/theme';
import { PersonalPlan } from '@/types/plan';
import { ClipboardCheck } from 'lucide-react-native';
import { shortDuration } from '@/lib/formatText';

type Props = {
  plan: PersonalPlan;
  weekNumber?: number;
};

// Helper to parse LLM trigger-action-duration strings
function parseStepString(step: string) {
  let parts = step.split('→').map((p) => p.trim());
  if (parts.length !== 3) {
    parts = step.split('->').map((p) => p.trim());
  }

  if (parts.length === 3) {
    return {
      trigger: parts[0],
      action: parts[1],
      duration: parts[2].replace(/takes\s+/i, '').toLowerCase(),
    };
  }

  return {
    trigger: null,
    action: step,
    duration: null,
  };
}

export default function WeekOnePlanCard({ plan, weekNumber }: Props) {
  const targetIndex = (weekNumber ?? plan.activeWeekNumber ?? 1) - 1;
  const phase = plan.phases?.[targetIndex] || plan.phases?.[0];
  if (!phase) return null;

  const actions = phase.actions ?? [];
  const trackingCount = phase.checkInQuestions?.length ?? 4;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.weekLabel}>PHASE {targetIndex + 1}: {phase.durationDays} DAYS</Text>
        <Text style={styles.focusTitle}>{phase.title}</Text>
        {phase.purpose && (
          <Text style={styles.whyText}>{phase.purpose}</Text>
        )}
      </View>

      {/* Weekly Objective */}
      <View style={styles.objectiveSection}>
        <Text style={styles.sectionTitle}>Phase entry condition</Text>
        <View style={styles.objectiveBar}>
          <Text style={styles.objectiveText}>{phase.entryCondition || 'No entry requirements'}</Text>
        </View>
      </View>

      {/* Routine Steps */}
      {actions.length > 0 && (
        <View style={styles.routineSection}>
          <Text style={styles.sectionTitle}>Your daily phase routine</Text>
          <View style={styles.stepsList}>
            {actions.map((act, idx) => {
              return (
                <View key={idx} style={styles.stepItem}>
                  <View style={styles.stepNumberWrap}>
                    <Text style={styles.stepNumber}>{idx + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    {act.trigger && (
                      <View style={styles.stepMetaRow}>
                        <Text style={styles.stepMeta}>{act.trigger}</Text>
                        {act.duration && <Text style={styles.stepMeta}>{shortDuration(act.duration)}</Text>}
                      </View>
                    )}
                    <Text style={styles.stepActionText}>{act.action}</Text>
                    {!act.trigger && act.duration && (
                      <Text style={styles.stepMeta}>{shortDuration(act.duration)}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Daily check-in nudge */}
      <View style={styles.checkInNote}>
        <ClipboardCheck size={15} color={palette.teal} />
        <Text style={styles.checkInText}>
          You'll get a quick daily check-in to log how it went and stay on track.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.xxxl - 4,
    width: '100%',
    ...cardShadow,
  },

  /* ── Header ── */
  headerSection: {
    gap: spacing.sm,
  },
  weekLabel: {
    fontSize: typography.caption + 1,
    fontWeight: '700',
    color: palette.teal,
    letterSpacing: 1.2,
  },
  focusTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: palette.slate,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  whyText: {
    fontSize: typography.body,
    lineHeight: 20,
    color: palette.slateMuted,
    marginTop: 2,
  },

  /* ── Routine ── */
  routineSection: {
    gap: spacing.lg - 2,
  },
  sectionTitle: {
    fontSize: typography.subtitle - 1,
    fontWeight: '700',
    color: palette.slate,
  },
  stepsList: {
    gap: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg - 2,
  },
  stepNumberWrap: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    backgroundColor: palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumber: {
    fontSize: typography.body - 2,
    fontWeight: '700',
    color: palette.teal,
  },
  stepContent: {
    flex: 1,
    gap: 3,
  },
  stepActionText: {
    fontSize: typography.subtitle - 1,
    fontWeight: '600',
    color: palette.slate,
    lineHeight: 21,
  },
  stepMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepMeta: {
    fontSize: typography.body - 1,
    color: palette.slateSubtle,
    lineHeight: 18,
  },

  /* ── Objective ── */
  objectiveSection: {
    gap: spacing.md,
  },
  objectiveBar: {
    borderLeftWidth: 3,
    borderLeftColor: palette.teal,
    paddingLeft: spacing.lg - 2,
    paddingVertical: 2,
  },
  objectiveText: {
    fontSize: typography.subtitle - 1,
    fontWeight: '600',
    color: palette.slate,
    lineHeight: 21,
  },
  /* ── Check-in nudge ── */
  checkInNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: palette.sageLight,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg - 2,
  },
  checkInText: {
    flex: 1,
    fontSize: typography.body - 1,
    lineHeight: 18,
    color: palette.slateMuted,
  },
}) as any;
