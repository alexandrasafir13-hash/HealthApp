import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';

interface Props {
  title: string;
  reason: string;
  completed: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function HabitListCard({
  title,
  reason,
  completed,
  onPress,
  onLongPress,
}: Props) {
  return (
    <Pressable
      style={[styles.habitCard, completed && styles.habitDone]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityHint={onLongPress ? 'Long press to remove this habit' : undefined}>
      <View style={[styles.checkbox, completed && styles.checkboxDone]}>
        {completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.habitContent}>
        <Text style={[styles.habitTitle, completed && styles.habitTitleDone]}>{title}</Text>
        <Text style={styles.habitReason}>{reason}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  habitCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  habitDone: {
    opacity: 0.92,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.slate,
    marginBottom: 4,
  },
  habitTitleDone: {
    textDecorationLine: 'line-through',
    color: palette.slateSubtle,
  },
  habitReason: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
});
