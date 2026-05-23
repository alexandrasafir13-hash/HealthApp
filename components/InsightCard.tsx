import { Link } from 'expo-router';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import RichInsightSummary from '@/components/RichInsightSummary';
import { Text } from '@/components/Themed';
import { flowBlue, flowBlueLight, flowBlueText, palette, severityColors } from '@/constants/theme';
import { BodyInsight } from '@/types/health';

interface Props {
  insight: BodyInsight;
  style?: StyleProp<ViewStyle>;
}

export default function InsightCard({ insight, style }: Props) {
  const severityColor = severityColors[insight.severity];

  return (
    <Link href={`/insight/${insight.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        <View style={styles.header}>
          <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
        </View>
        <Text style={styles.title}>{insight.title}</Text>
        <RichInsightSummary insight={insight} numberOfLines={3} variant="card" />
        <View style={styles.flowPreview}>
          <FlowDot label="Cause" />
          <Text style={styles.arrow}>→</Text>
          <FlowDot label="Effect" />
          <Text style={styles.arrow}>→</Text>
          <FlowDot label="Action" />
        </View>
      </Pressable>
    </Link>
  );
}

function FlowDot({ label }: { label: string }) {
  return (
    <View style={styles.flowDotItem}>
      <View style={styles.flowDot} />
      <Text style={styles.flowDotLabel}>{label}</Text>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
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
  flowPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  flowDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  flowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: flowBlueLight,
    borderWidth: 1,
    borderColor: flowBlue,
  },
  flowDotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: flowBlueText,
  },
  arrow: {
    fontSize: 12,
    color: palette.slateSubtle,
    marginHorizontal: 2,
  },
});
