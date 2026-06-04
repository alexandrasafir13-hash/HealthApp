import { useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';

import { capitalizeSentences } from '@/lib/formatText';
import { metricScaleColors, palette } from '@/constants/theme';
import { MetricScaleConfig } from '@/types/health';

export type MetricScaleState = 'good' | 'caution' | 'action';

const STATE_COLORS: Record<MetricScaleState, { main: string; bg: string }> = {
  good: { main: metricScaleColors.good, bg: metricScaleColors.goodBg },
  caution: { main: metricScaleColors.caution, bg: metricScaleColors.cautionBg },
  action: { main: metricScaleColors.action, bg: metricScaleColors.actionBg },
};

const STATE_LABELS: Record<MetricScaleState, string> = {
  good: 'Good',
  caution: 'Not good',
  action: 'Take action',
};

export function getMetricScaleState(config: MetricScaleConfig): MetricScaleState {
  const { value, lowerIsBetter, goodMin = 7, cautionMin = 5.5, goodMax = 5, cautionMax = 12 } = config;

  if (lowerIsBetter) {
    if (value <= goodMax) return 'good';
    if (value <= cautionMax) return 'caution';
    return 'action';
  }

  if (value >= goodMin) return 'good';
  if (value >= cautionMin) return 'caution';
  return 'action';
}

const CHECK_IN_SCALE = {
  min: 1,
  max: 5,
  goodMin: 4,
  cautionMin: 3,
  goodMax: 2,
  cautionMax: 3,
} as const;

export function getCheckInMetricState(value: number, lowerIsBetter = false): MetricScaleState {
  return getMetricScaleState({
    value,
    ...CHECK_IN_SCALE,
    lowerIsBetter,
  });
}

export function getMetricStateColors(state: MetricScaleState): { main: string; bg: string } {
  return STATE_COLORS[state];
}

const STATE_RANK: Record<MetricScaleState, number> = {
  good: 1,
  caution: 2,
  action: 3,
};

export function getWorstMetricState(states: MetricScaleState[]): MetricScaleState {
  return states.reduce(
    (worst, state) => (STATE_RANK[state] > STATE_RANK[worst] ? state : worst),
    'good',
  );
}

export function getCheckInOverviewState(checkIn: {
  energy: number;
  sleepQuality?: number;
  stress?: number;
}): MetricScaleState {
  const states = [getCheckInMetricState(checkIn.energy)];
  if (checkIn.sleepQuality != null) {
    states.push(getCheckInMetricState(checkIn.sleepQuality));
  }
  if (checkIn.stress != null) {
    states.push(getCheckInMetricState(checkIn.stress, true));
  }
  return getWorstMetricState(states);
}

export function getMetricStateBoxStyle(state: MetricScaleState) {
  const colors = getMetricStateColors(state);
  return {
    backgroundColor: colors.bg,
    borderColor: colors.main + '55',
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatScaleEnd(value: number, unit: string) {
  if (!unit) return String(value);
  if (unit === 'bpm') return `${value} bpm`;
  if (unit === 'h' || unit === '%') return `${value}${unit}`;
  return `${value}${unit}`;
}

function formatMetricValue(value: number, unit: string, display?: string) {
  if (display) return display;
  if (unit === 'h') return `${Number.isInteger(value) ? value : value.toFixed(1)}h`;
  if (unit === '%') return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
  if (unit === 'bpm') return `${Number.isInteger(value) ? value : value.toFixed(1)} bpm`;
  return `${value}${unit}`;
}

export interface MetricScaleMarkerProps extends MetricScaleConfig {
  size?: 'compact' | 'regular';
  /** full: value pill + bar + scale ends (+ optional steps). minimal: bar + state label only */
  variant?: 'full' | 'minimal';
  showStateLabel?: boolean;
  style?: ViewStyle;
  /** When set, enables value selection (numbered steps in full, tap zones on bar in minimal) */
  onValueChange?: (value: number) => void;
}

export default function MetricScaleMarker({
  value,
  min = 2,
  max = 10,
  unit = 'h',
  display,
  lowerIsBetter = false,
  goodMin = 7,
  cautionMin = 5.5,
  goodMax = 5,
  cautionMax = 12,
  size = 'compact',
  variant = 'full',
  showStateLabel,
  style,
  onValueChange,
}: MetricScaleMarkerProps) {
  const isCompact = size === 'compact';
  const isMinimal = variant === 'minimal';
  const showLabel = showStateLabel ?? (!isCompact || isMinimal);

  const config = useMemo(
    () => ({
      value,
      min,
      max,
      unit,
      display,
      lowerIsBetter,
      goodMin,
      cautionMin,
      goodMax,
      cautionMax,
    }),
    [value, min, max, unit, display, lowerIsBetter, goodMin, cautionMin, goodMax, cautionMax]
  );

  const state = getMetricScaleState(config);
  const colors = STATE_COLORS[state];

  const { position, zoneFlex } = useMemo(() => {
    const range = max - min;
    const clamped = clamp(value, min, max);
    const positionPct = range > 0 ? ((clamped - min) / range) * 100 : 0;

    let actionFlex: number;
    let cautionFlex: number;
    let goodFlex: number;

    if (lowerIsBetter) {
      const greenEnd = clamp(goodMax, min, max);
      const orangeEnd = clamp(cautionMax, min, max);
      goodFlex = Math.max(greenEnd - min, 0);
      cautionFlex = Math.max(orangeEnd - greenEnd, 0);
      actionFlex = Math.max(max - orangeEnd, 0);
    } else {
      const redEnd = clamp(cautionMin, min, max);
      const orangeEnd = clamp(goodMin, min, max);
      actionFlex = Math.max(redEnd - min, 0);
      cautionFlex = Math.max(orangeEnd - redEnd, 0);
      goodFlex = Math.max(max - orangeEnd, 0);
    }

    const total = actionFlex + cautionFlex + goodFlex || 1;

    return {
      position: positionPct,
      zoneFlex: {
        action: actionFlex / total,
        caution: cautionFlex / total,
        good: goodFlex / total,
      },
    };
  }, [value, min, max, lowerIsBetter, cautionMin, goodMin, goodMax, cautionMax]);

  const formattedValue = formatMetricValue(value, unit, display);
  const steps = useMemo(() => {
    const count = Math.floor(max - min) + 1;
    return Array.from({ length: count }, (_, i) => min + i);
  }, [min, max]);

  const trackNode = (
    <View style={[styles.track, isCompact && !isMinimal && styles.trackCompact, isMinimal && styles.trackMinimal]}>
      <View style={styles.zones}>
        {lowerIsBetter ? (
          <>
            <View style={[styles.zone, { flex: zoneFlex.good, backgroundColor: metricScaleColors.goodBg }]} />
            <View
              style={[styles.zone, { flex: zoneFlex.caution, backgroundColor: metricScaleColors.cautionBg }]}
            />
            <View style={[styles.zone, { flex: zoneFlex.action, backgroundColor: metricScaleColors.actionBg }]} />
          </>
        ) : (
          <>
            <View style={[styles.zone, { flex: zoneFlex.action, backgroundColor: metricScaleColors.actionBg }]} />
            <View
              style={[styles.zone, { flex: zoneFlex.caution, backgroundColor: metricScaleColors.cautionBg }]}
            />
            <View style={[styles.zone, { flex: zoneFlex.good, backgroundColor: metricScaleColors.goodBg }]} />
          </>
        )}
      </View>
      <View
        style={[
          styles.marker,
          isCompact && styles.markerCompact,
          isMinimal && styles.markerMinimal,
          {
            left: `${position}%`,
            backgroundColor: colors.main,
            borderColor: palette.white,
          },
        ]}
      />
      {onValueChange && isMinimal && (
        <View style={styles.trackTapRow}>
          {steps.map((step) => (
            <Pressable
              key={step}
              style={styles.trackTapZone}
              onPress={() => onValueChange(step)}
              accessibilityRole="button"
              accessibilityLabel={`${step} of ${max}`}
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[styles.wrap, isCompact ? styles.wrapCompact : styles.wrapRegular, style]}
      accessibilityRole="text"
      accessibilityLabel={`${formattedValue}, ${STATE_LABELS[state]}, scale ${min} to ${max} ${unit}`}>
      {isMinimal ? (
        <>
          {showLabel && (
            <Text style={[styles.stateLabelMinimal, { color: colors.main }]}>
            {capitalizeSentences(STATE_LABELS[state])}
          </Text>
          )}
          {trackNode}
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>{formatScaleEnd(min, unit)}</Text>
            <Text style={styles.scaleLabel}>{formatScaleEnd(max, unit)}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.valueRow}>
            <View style={[styles.valuePill, { backgroundColor: colors.bg }]}>
              <Text style={[styles.valueText, isCompact && styles.valueTextCompact, { color: colors.main }]}>
                {formattedValue}
              </Text>
            </View>
            {showLabel && (
              <Text style={[styles.stateLabel, { color: colors.main }]}>
                {capitalizeSentences(STATE_LABELS[state])}
              </Text>
            )}
          </View>
          {trackNode}
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>{formatScaleEnd(min, unit)}</Text>
            <Text style={styles.scaleLabel}>{formatScaleEnd(max, unit)}</Text>
          </View>
          {onValueChange && (
            <View style={styles.stepRow}>
              {steps.map((step) => {
                const selected = step === value;
                const stepState = getMetricScaleState({ ...config, value: step });
                const stepColor = STATE_COLORS[stepState].main;
                return (
                  <Pressable
                    key={step}
                    style={[
                      styles.stepButton,
                      selected && { backgroundColor: stepColor, borderColor: stepColor },
                    ]}
                    onPress={() => onValueChange(step)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${step} of ${max}`}>
                    <Text style={[styles.stepText, selected && styles.stepTextSelected]}>{step}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'stretch',
  },
  wrapCompact: {
    maxWidth: 260,
  },
  wrapRegular: {
    maxWidth: 320,
    marginVertical: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  valuePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  valueText: {
    fontSize: 17,
    fontWeight: '800',
  },
  valueTextCompact: {
    fontSize: 15,
  },
  stateLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  stateLabelMinimal: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: palette.border,
  },
  trackCompact: {
    height: 8,
  },
  trackMinimal: {
    height: 12,
    borderRadius: 6,
  },
  trackTapRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  trackTapZone: {
    flex: 1,
  },
  markerMinimal: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: -7,
    marginLeft: -7,
  },
  zones: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  zone: {
    height: '100%',
  },
  marker: {
    position: 'absolute',
    top: '50%',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: -7,
    marginLeft: -7,
    borderWidth: 2,
  },
  markerCompact: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: -6,
    marginLeft: -6,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleLabel: {
    fontSize: 10,
    color: palette.slateSubtle,
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  stepButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.slateMuted,
  },
  stepTextSelected: {
    color: palette.white,
  },
});
