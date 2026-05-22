import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import InsightCard from '@/components/InsightCard';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { palette } from '@/constants/theme';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { insights } = useHealth();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Body insights</Text>
      <Text style={styles.subtitle}>
        Every insight follows cause → effect → action so you understand why, what it means, and what to do.
      </Text>

      <View style={styles.legend}>
        <LegendItem color="#5B7FD4" label="Cause — what triggered it" />
        <LegendItem color={palette.amber} label="Effect — what your body is doing" />
        <LegendItem color={palette.teal} label="Action — what to do next" />
      </View>

      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </ScrollView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.slate,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 20,
  },
  legend: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 13,
    color: palette.slateMuted,
  },
});
