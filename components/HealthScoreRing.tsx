import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { BodyStatus } from '@/types/health';

interface Props {
  status: BodyStatus;
}

export default function HealthScoreRing({ status }: Props) {
  const trendIcon =
    status.trend === 'improving' ? '↑' : status.trend === 'declining' ? '↓' : '→';
  const trendColor =
    status.trend === 'improving'
      ? palette.teal
      : status.trend === 'declining'
        ? palette.coral
        : palette.slateMuted;

  return (
    <View style={styles.container}>
      <View style={styles.ring}>
        <Text style={styles.score}>{status.score}</Text>
        <Text style={styles.scoreLabel}>Body readiness</Text>
      </View>
      <View style={styles.textBlock}>
        <View style={styles.labelRow}>
          <Text style={styles.statusLabel}>{status.label}</Text>
          <Text style={[styles.trend, { color: trendColor }]}>
            {trendIcon} {status.trend}
          </Text>
        </View>
        <Text style={styles.message}>{status.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: palette.sageLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.white,
    borderWidth: 4,
    borderColor: palette.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.tealDark,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: palette.slateMuted,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  textBlock: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
  },
  trend: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
});
