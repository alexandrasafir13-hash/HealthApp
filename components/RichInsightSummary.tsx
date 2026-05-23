import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import MetricScaleMarker from '@/components/MetricScaleMarker';
import { capitalizeSentences } from '@/lib/formatText';
import { categoryColors, palette } from '@/constants/theme';
import { BodyInsight, SummaryTone } from '@/types/health';

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

export default function RichInsightSummary({
  insight,
  numberOfLines,
  style,
  variant = 'card',
}: Props) {
  const baseStyle = variant === 'detail' ? styles.detail : styles.card;
  const markerSize = variant === 'detail' ? 'regular' : 'compact';

  if (!insight.summaryHighlights?.length) {
    return (
      <Text style={[baseStyle, style]} numberOfLines={numberOfLines}>
        {insight.summary}
      </Text>
    );
  }

  const hasMetric = insight.summaryHighlights.some((s) => s.metric);

  if (hasMetric) {
    return (
      <View style={[styles.block, variant === 'detail' && styles.blockDetail, style]}>
        <View style={styles.inlineRow}>
          {insight.summaryHighlights.map((segment, index) =>
            segment.metric ? (
              <View key={index} style={styles.metricRow}>
                <MetricScaleMarker
                  {...segment.metric}
                  size={markerSize}
                  showStateLabel={variant === 'detail'}
                />
              </View>
            ) : (
              <Text key={index} style={[baseStyle, styles.inlineText, toneStyles[segment.tone ?? 'body']]}>
                {capitalizeSentences(segment.text)}
              </Text>
            )
          )}
        </View>
      </View>
    );
  }

  return (
    <Text style={[baseStyle, style]} numberOfLines={numberOfLines}>
      {insight.summaryHighlights.map((segment, index) => (
        <Text key={index} style={toneStyles[segment.tone ?? 'body']}>
          {capitalizeSentences(segment.text)}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    fontSize: 14,
    lineHeight: 22,
  },
  detail: {
    fontSize: 16,
    lineHeight: 26,
  },
  block: {
    marginBottom: 12,
  },
  blockDetail: {
    marginBottom: 20,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
  },
  inlineText: {
    marginBottom: 0,
  },
  metricRow: {
    width: '100%',
    marginVertical: 6,
  },
});
