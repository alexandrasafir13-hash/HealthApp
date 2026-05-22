import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { BodyInsight } from '@/types/health';

interface Props {
  insight: BodyInsight;
  compact?: boolean;
}

export default function CauseEffectAction({ insight, compact }: Props) {
  const steps = [
    {
      key: 'cause',
      label: 'Cause',
      color: '#5B7FD4',
      headline: insight.cause.headline,
      detail: insight.cause.detail,
      bullets: insight.cause.signals,
    },
    {
      key: 'effect',
      label: 'Effect',
      color: palette.amber,
      headline: insight.effect.headline,
      detail: insight.effect.detail,
      bullets: insight.effect.bodySignals,
    },
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step.key}>
          <View style={styles.stepRow}>
            <View style={[styles.badge, { backgroundColor: step.color }]}>
              <Text style={styles.badgeText}>{index + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepLabel, { color: step.color }]}>{step.label}</Text>
              <Text style={styles.headline}>{step.headline}</Text>
              {!compact && <Text style={styles.detail}>{step.detail}</Text>}
              {step.bullets.map((b) => (
                <View key={b} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
          {index < steps.length - 1 && <View style={styles.connector} />}
        </View>
      ))}
      <View style={styles.actionBlock}>
        <View style={[styles.badge, { backgroundColor: palette.teal }]}>
          <Text style={styles.badgeText}>→</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={[styles.stepLabel, { color: palette.teal }]}>Action</Text>
          <Text style={styles.headline}>What to do now</Text>
          {insight.actions.map((action) => (
            <View key={action.id} style={styles.actionItem}>
              <Text style={styles.actionTitle}>
                {action.priority === 1 ? '★ ' : ''}
                {action.title}
              </Text>
              {!compact && <Text style={styles.detail}>{action.description}</Text>}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  actionBlock: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 8,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    color: palette.slate,
  },
  detail: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: palette.slateSubtle,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
    color: palette.slateMuted,
  },
  connector: {
    width: 2,
    height: 16,
    backgroundColor: palette.border,
    marginLeft: 13,
    marginVertical: 4,
  },
  actionItem: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: palette.slate,
  },
});
