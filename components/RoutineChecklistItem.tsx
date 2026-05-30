import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';

interface Props {
  title: string;
  doneWhen: string;
  timeHint?: string;
  completed: boolean;
  onPress: () => void;
}

export default function RoutineChecklistItem({
  title,
  doneWhen,
  timeHint,
  completed,
  onPress,
}: Props) {
  return (
    <Pressable
      style={[styles.card, completed && styles.cardDone]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={title}>
      <View pointerEvents="none" style={[styles.checkbox, completed && styles.checkboxDone]}>
        {completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View pointerEvents="none" style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, completed && styles.titleDone]}>{title}</Text>
          {timeHint != null && timeHint.length > 0 && (
            <Text style={styles.timeHint}>{timeHint}</Text>
          )}
        </View>
        <Text style={styles.doneWhen}>Done when: {doneWhen}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardDone: {
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
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: palette.slate,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: palette.slateSubtle,
  },
  timeHint: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.teal,
  },
  doneWhen: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
});
