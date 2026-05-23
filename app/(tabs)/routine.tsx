import { ScrollView, StyleSheet, View } from 'react-native';

import CheckInForm from '@/components/CheckInForm';
import CustomHabitsSection from '@/components/CustomHabitsSection';
import HabitListCard from '@/components/HabitListCard';
import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette } from '@/constants/theme';

export default function RoutineScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { habits, customHabits, toggleHabit, addCustomHabit, toggleCustomHabit, removeCustomHabit } =
    useHealth();
  const allHabits = [...habits, ...customHabits];
  const completed = allHabits.filter((h) => h.completed).length;
  const total = allHabits.length;
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={pageStyle}>
        <PageTitle
          title="Daily routine"
          subtitle="Predictable timing and small habits—tied to your insights—help prevent problems before they grow."
        />

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today&apos;s habits</Text>
          <Text style={styles.progressValue}>
            {completed} / {total} complete
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {habits.map((habit) => (
          <HabitListCard
            key={habit.id}
            title={habit.title}
            time={habit.time}
            reason={habit.reason}
            completed={habit.completed}
            onPress={() => toggleHabit(habit.id)}
          />
        ))}

        <CustomHabitsSection
          habits={customHabits}
          onAdd={addCustomHabit}
          onToggle={toggleCustomHabit}
          onRemove={removeCustomHabit}
        />

        <View style={styles.checkInSection}>
          <Text style={styles.checkInTitle}>Daily check-in</Text>
          <CheckInForm />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
