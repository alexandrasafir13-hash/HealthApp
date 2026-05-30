import { StyleSheet, Text, View } from 'react-native';

import { routineLabelFont } from '@/components/RoutineOutlineLabel';
import {
  getCheckInOverviewState,
  getMetricStateBoxStyle,
  MetricScaleState,
} from '@/components/MetricScaleMarker';
import { categoryAttentionColor, metricScaleColors, palette } from '@/constants/theme';
import {
  formatRoutineMetricsSummary,
  formatSymptomsSummary,
  hasReportedSymptoms,
} from '@/lib/deriveInsightsFromCheckIn';
import { DailyCheckIn } from '@/types/health';

interface Props {
  checkIn: DailyCheckIn | null;
  routineCompleted: number;
  routineTotal: number;
}

/** Banner uses app orange for caution/action — not metric scale red. */
function bannerMetricsBoxStyle(state: MetricScaleState | null) {
  if (!state) return null;
  if (state === 'good') return getMetricStateBoxStyle('good');
  return {
    backgroundColor:
      state === 'action' ? metricScaleColors.cautionBg : metricScaleColors.cautionBgLight,
    borderColor: categoryAttentionColor + '55',
  };
}

export default function TodayCheckInBanner({ checkIn, routineCompleted, routineTotal }: Props) {
  const completionPct = routineTotal > 0 ? routineCompleted / routineTotal : 0;
  const reportedSymptoms = checkIn != null && hasReportedSymptoms(checkIn);

  const metricsState = checkIn ? getCheckInOverviewState(checkIn) : null;
  const metricsBoxStyle = metricsState ? bannerMetricsBoxStyle(metricsState) : null;

  const onTrack = metricsState === 'good' && !reportedSymptoms;
  const alertAccent = categoryAttentionColor;

  const bannerStyle = {
    backgroundColor: palette.card,
    borderColor: palette.border,
  };

  const titleStyle = onTrack
    ? styles.titleGood
    : [styles.titleAlert, !onTrack && checkIn ? { color: alertAccent } : null];

  const hintStyle = onTrack ? styles.hintGood : { color: alertAccent };

  const symptomStyle = reportedSymptoms ? styles.bodySymptoms : styles.body;

  const routineLine =
    routineTotal > 0
      ? `${routineCompleted} of ${routineTotal} routine checks complete (${Math.round(completionPct * 100)}%)`
      : null;

  return (
    <View style={[styles.banner, bannerStyle]}>
      <Text style={[styles.title, titleStyle]}>Based on your routine and symptoms</Text>
      {routineLine && <Text style={styles.body}>{routineLine}</Text>}
      {checkIn && (
        <>
          <View style={[styles.metricsBox, metricsBoxStyle]}>
            <Text style={styles.metricsText}>{formatRoutineMetricsSummary(checkIn)}</Text>
          </View>
          <Text style={[styles.body, symptomStyle]}>{formatSymptomsSummary(checkIn)}</Text>
        </>
      )}
      <Text style={[styles.hint, hintStyle]}>
        Top priorities below reflect your past week of routine checks and symptoms.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    ...routineLabelFont,
    marginBottom: 6,
  },
  titleGood: {
    color: metricScaleColors.good,
  },
  titleAlert: {
    color: palette.slate,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    color: palette.slate,
  },
  metricsBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  metricsText: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slate,
    fontWeight: '600',
  },
  bodySymptoms: {
    color: categoryAttentionColor,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
  },
  hintGood: {
    color: metricScaleColors.good,
  },
});
