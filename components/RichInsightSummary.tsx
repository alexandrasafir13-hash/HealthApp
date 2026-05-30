import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { getMetricScaleState, getMetricStateColors } from '@/components/MetricScaleMarker';
import { capitalizeSentences } from '@/lib/formatText';
import { categoryColors, palette } from '@/constants/theme';
import { BodyInsight, MetricScaleConfig, SummaryTone } from '@/types/health';

const toneStyles: Record<SummaryTone, TextStyle> = {
  body: {
    color: palette.slateMuted,
    fontWeight: '400',
  },
  metric: {
    color: palette.slate,
    fontWeight: '800',
  },
  sleep: {
    color: categoryColors.sleep,
    fontWeight: '700',
  },
  recovery: {
    color: categoryColors.recovery,
    fontWeight: '700',
  },
  immunity: {
    color: categoryColors.immunity,
    fontWeight: '700',
  },
  stress: {
    color: categoryColors.stress,
    fontWeight: '700',
  },
  caution: {
    color: palette.amber,
    fontWeight: '600',
  },
};

interface Props {
  insight: BodyInsight;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  variant?: 'card' | 'detail';
}

function formatMetricDisplay({ value, unit = '', display }: MetricScaleConfig): string {
  if (display) return display;
  if (unit === 'h') return `${Number.isInteger(value) ? value : value.toFixed(1)}h`;
  if (unit === '%') return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
  if (unit === 'bpm') return `${Number.isInteger(value) ? value : value.toFixed(1)} bpm`;
  return `${value}${unit}`;
}

function MetricPill({ config }: { config: MetricScaleConfig }) {
  const state = getMetricScaleState(config);
  const colors = getMetricStateColors(state);

  return (
    <View style={[styles.metricPill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.metricPillText, { color: colors.main }]}>{formatMetricDisplay(config)}</Text>
    </View>
  );
}

export default function RichInsightSummary({
  insight,
  numberOfLines,
  style,
  variant = 'card',
}: Props) {
  const baseStyle = variant === 'detail' ? styles.detail : styles.card;

  if (!insight.summaryHighlights?.length) {
    return (
      <Text style={[baseStyle, style]} numberOfLines={numberOfLines}>
        {insight.summary}
      </Text>
    );
  }

  return (
    <View style={[styles.wrap, style as StyleProp<ViewStyle>]}>
      {insight.summaryHighlights.map((segment, index) =>
        segment.metric ? (
          <MetricPill key={index} config={segment.metric} />
        ) : (
          <Text key={index} style={[baseStyle, toneStyles[segment.tone ?? 'body']]}>
            {capitalizeSentences(segment.text)}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
  },
  card: {
    fontSize: 14,
    lineHeight: 22,
  },
  detail: {
    fontSize: 16,
    lineHeight: 26,
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  metricPillText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
