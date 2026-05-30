import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { FEELING_OPTIONS, metricsFromFeeling } from '@/lib/feelingScale';
import { palette } from '@/constants/theme';

export default function TodayFeelingPicker() {
  const { todayFeeling, updateTodayDraft, isReady } = useHealth();
  const selected = todayFeeling;

  if (!isReady) return null;

  return (
    <View style={styles.wrap}>
      {FEELING_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
            onPress={() => {
              const metrics = metricsFromFeeling(option.value);
              updateTodayDraft({
                energy: option.value,
                ...metrics,
                ...(option.value > 2 ? { symptoms: ['None'] as string[] } : {}),
              });
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Feeling: ${option.label}`}>
            <Text
              pointerEvents="none"
              style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 32,
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  optionSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  optionPressed: {
    opacity: 0.9,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: palette.tealDark,
  },
});
