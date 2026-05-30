import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';

interface Props {
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const routineLabelFont = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '700',
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
}).text;

export const routineOutlineLabelStyles = StyleSheet.create({
  outline: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: palette.tealDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: palette.sageLight,
  },
  label: {
    ...routineLabelFont,
    color: palette.tealDark,
  },
  pressed: {
    opacity: 0.85,
  },
});

export default function RoutineOutlineLabel({ label, onPress, accessibilityLabel }: Props) {
  const text = <Text style={routineOutlineLabelStyles.label}>{label}</Text>;

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          routineOutlineLabelStyles.outline,
          pressed && routineOutlineLabelStyles.pressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        android_ripple={{ color: 'rgba(31, 92, 86, 0.15)' }}>
        {text}
      </Pressable>
    );
  }

  return <View style={routineOutlineLabelStyles.outline}>{text}</View>;
}
