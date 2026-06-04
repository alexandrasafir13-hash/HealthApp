import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Share row width evenly (Today symptom / habit rows). */
  expand?: boolean;
}

export default function TodaySelectChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  expand = false,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        expand && styles.chipExpand,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}>
      <Text style={[styles.label, selected && styles.labelSelected, { pointerEvents: 'none' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  chipExpand: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 52,
    paddingHorizontal: 6,
  },
  chipSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  chipPressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate,
    textAlign: 'center',
  },
  labelSelected: {
    color: palette.tealDark,
  },
});
