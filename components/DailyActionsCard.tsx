import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import { palette, radii, spacing, typography, cardShadow } from '@/constants/theme';
import { PlanPhase } from '@/types/plan';
import { CheckCircle } from 'lucide-react-native';

type Props = {
  phase: PlanPhase;
};

export default function DailyActionsCard({ phase }: Props) {
  const actions = phase.actions ?? [];
  if (actions.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <CheckCircle size={18} color={palette.teal} />
        <Text style={styles.title}>Your Daily Actions</Text>
      </View>
      <View style={styles.list}>
        {actions.map((act, idx) => (
          <View key={act.id} style={styles.item}>
            <View style={styles.numberContainer}>
              <Text style={styles.number}>{idx + 1}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.actionText}>{act.action}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    ...cardShadow,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.sageLight,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: palette.slate,
  },
  list: {
    gap: spacing.lg - 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  numberContainer: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    backgroundColor: palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  number: {
    fontSize: typography.body - 2,
    fontWeight: '700',
    color: palette.teal,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  actionText: {
    fontSize: typography.subtitle - 1,
    fontWeight: '600',
    color: palette.slate,
    lineHeight: 20,
  },
});
