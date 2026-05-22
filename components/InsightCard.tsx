import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { categoryColors, palette, severityColors } from '@/constants/theme';
import { BodyInsight } from '@/types/health';

interface Props {
  insight: BodyInsight;
}

export default function InsightCard({ insight }: Props) {
  const severityColor = severityColors[insight.severity];
  const categoryColor = categoryColors[insight.category];

  return (
    <Link href={`/insight/${insight.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.header}>
          <View style={[styles.categoryPill, { backgroundColor: categoryColor + '22' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {insight.category}
            </Text>
          </View>
          <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
        </View>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.summary} numberOfLines={2}>
          {insight.summary}
        </Text>
        <View style={styles.flowPreview}>
          <FlowChip label="Cause" value={insight.cause.headline} color="#5B7FD4" />
          <Text style={styles.arrow}>→</Text>
          <FlowChip label="Effect" value={insight.effect.headline} color={palette.amber} />
          <Text style={styles.arrow}>→</Text>
          <FlowChip label="Action" value={insight.actions[0]?.title ?? ''} color={palette.teal} />
        </View>
        <Text style={styles.meta}>
          {insight.confidence}% confidence · {insight.connectedMetrics.length} signals
        </Text>
      </Pressable>
    </Link>
  );
}

function FlowChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
      <Text style={styles.chipValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: palette.slate,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 12,
  },
  flowPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  chip: {
    flex: 1,
    minWidth: 0,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  chipValue: {
    fontSize: 11,
    color: palette.slateSubtle,
  },
  arrow: {
    fontSize: 12,
    color: palette.slateSubtle,
    marginHorizontal: 2,
  },
  meta: {
    fontSize: 12,
    color: palette.slateSubtle,
  },
});
