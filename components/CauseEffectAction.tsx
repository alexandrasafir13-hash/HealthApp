import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { flowBlue, flowBlueLight, flowBlueText, palette } from '@/constants/theme';
import { BodyInsight } from '@/types/health';

type FlowSection = 'cause' | 'effect' | 'action';

interface Props {
  insight: BodyInsight;
  compact?: boolean;
}

function FlowDot({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.dotItem, pressed && styles.dotItemPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: active }}
      accessibilityLabel={label}>
      <View style={[styles.dot, active && styles.dotActive]} />
      <Text style={[styles.dotLabel, active && styles.dotLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function CauseEffectAction({ insight, compact }: Props) {
  const [open, setOpen] = useState<FlowSection | null>(null);

  const toggle = (section: FlowSection) => {
    setOpen((current) => (current === section ? null : section));
  };

  return (
    <View style={styles.container}>
      <View style={styles.dotRow}>
        <FlowDot label="Cause" active={open === 'cause'} onPress={() => toggle('cause')} />
        <FlowDot label="Effect" active={open === 'effect'} onPress={() => toggle('effect')} />
        <FlowDot label="Action" active={open === 'action'} onPress={() => toggle('action')} />
      </View>

      {open === 'cause' && (
        <View style={styles.panel}>
          <Text style={styles.headline}>{insight.cause.headline}</Text>
          {!compact && <Text style={styles.detail}>{insight.cause.detail}</Text>}
          {insight.cause.signals.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {open === 'effect' && (
        <View style={styles.panel}>
          <Text style={styles.headline}>{insight.effect.headline}</Text>
          {!compact && <Text style={styles.detail}>{insight.effect.detail}</Text>}
          {insight.effect.bodySignals.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {open === 'action' && (
        <View style={styles.panel}>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dotItemPressed: {
    opacity: 0.75,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: flowBlueLight,
    borderWidth: 1,
    borderColor: flowBlue,
  },
  dotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: flowBlue,
    borderColor: flowBlueText,
  },
  dotLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: flowBlueText,
  },
  dotLabelActive: {
    fontWeight: '700',
    color: palette.slate,
  },
  panel: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: flowBlueLight,
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
    fontWeight: '700',
    color: flowBlueText,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
    color: palette.slateMuted,
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
