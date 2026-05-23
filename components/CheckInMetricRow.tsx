import { StyleSheet, View } from 'react-native';

import MetricScaleMarker from '@/components/MetricScaleMarker';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Stress: lower is better. Energy & sleep: higher is better (default) */
  lowerIsBetter?: boolean;
}

export default function CheckInMetricRow({ label, value, onChange, lowerIsBetter }: Props) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <MetricScaleMarker
        value={value}
        min={1}
        max={5}
        unit=""
        lowerIsBetter={lowerIsBetter}
        goodMin={4}
        cautionMin={3}
        goodMax={2}
        cautionMax={3}
        variant="minimal"
        showStateLabel
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 20,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate,
    marginBottom: 12,
  },
});
