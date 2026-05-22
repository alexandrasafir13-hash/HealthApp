import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CheckInForm from '@/components/CheckInForm';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { palette } from '@/constants/theme';

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const { habits, toggleHabit } = useHealth();
  const completed = habits.filter((h) => h.completed).length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Daily routine</Text>
      <Text style={styles.subtitle}>
        Predictable timing and small habits—tied to your insights—help prevent problems before they grow.
      </Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Today&apos;s habits</Text>
        <Text style={styles.progressValue}>
          {completed} / {habits.length} complete
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(completed / habits.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {habits.map((habit) => (
        <Pressable
          key={habit.id}
          style={[styles.habitCard, habit.completed && styles.habitDone]}
          onPress={() => toggleHabit(habit.id)}>
          <View style={[styles.checkbox, habit.completed && styles.checkboxDone]}>
            {habit.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.habitContent}>
            <View style={styles.habitHeader}>
              <Text style={[styles.habitTitle, habit.completed && styles.habitTitleDone]}>
                {habit.title}
              </Text>
              <Text style={styles.habitTime}>{habit.time}</Text>
            </View>
            <Text style={styles.habitReason}>{habit.reason}</Text>
          </View>
        </Pressable>
      ))}

      <View style={styles.checkInSection}>
        <Text style={styles.checkInTitle}>Daily check-in</Text>
        <CheckInForm />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.slate,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: palette.slate,
  },
  progressValue: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.teal,
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.teal,
    borderRadius: 3,
  },
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
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.slate,
  },
  habitTitleDone: {
    textDecorationLine: 'line-through',
    color: palette.slateSubtle,
  },
  habitTime: {
    fontSize: 13,
    color: palette.teal,
    fontWeight: '600',
  },
  habitReason: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
  checkInSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  checkInTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: palette.slate,
  },
});
