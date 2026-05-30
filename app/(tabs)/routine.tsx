import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CheckInSection from '@/components/CheckInSection';
import CustomHabitsSection from '@/components/CustomHabitsSection';
import HabitListCard from '@/components/HabitListCard';
import PageTitle from '@/components/PageTitle';
import RoutineDateSelector from '@/components/RoutineDateSelector';
import RoutineUpdateButton from '@/components/RoutineUpdateButton';
import SymptomsSection from '@/components/SymptomsSection';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { localDateKey } from '@/lib/localDate';
import { clampDateKey, formatRoutineHabitsTitle } from '@/lib/routineDates';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette } from '@/constants/theme';

export default function RoutineScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const {
    accountStartDate,
    getHabitsForDate,
    toggleHabit,
    addCustomHabit,
    toggleCustomHabit,
    removeCustomHabit,
    refreshHabitCompletions,
    isReady,
  } = useHealth();

  const todayKey = localDateKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);

  useEffect(() => {
    if (!isReady) return;
    setSelectedDate((prev) => clampDateKey(prev, accountStartDate, todayKey));
  }, [isReady, accountStartDate, todayKey]);

  useFocusEffect(
    useCallback(() => {
      void refreshHabitCompletions();
      setSelectedDate((prev) => clampDateKey(prev, accountStartDate, localDateKey()));
    }, [accountStartDate, refreshHabitCompletions]),
  );

  const { habits, customHabits, completed, total } = useMemo(
    () => getHabitsForDate(selectedDate),
    [getHabitsForDate, selectedDate],
  );

  const getCompletionForDate = useCallback(
    (dateKey: string) => {
      const { completed, total } = getHabitsForDate(dateKey);
      return total > 0 ? completed / total : null;
    },
    [getHabitsForDate],
  );

  const progressPct = total > 0 ? (completed / total) * 100 : 0;
  const progressTitle = formatRoutineHabitsTitle(selectedDate, todayKey);

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={pageStyle}>
        <PageTitle
          title="Daily routine"
          subtitle="Predictable timing and small habits—tied to your insights—help prevent problems before they grow."
        />

        <RoutineDateSelector
          selectedDate={selectedDate}
          minDate={accountStartDate}
          maxDate={todayKey}
          onChange={setSelectedDate}
          getCompletionForDate={getCompletionForDate}
        />

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{progressTitle}</Text>
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
            reason={habit.reason}
            completed={habit.completed}
            onPress={() => toggleHabit(habit.id, selectedDate)}
          />
        ))}

        <CustomHabitsSection
          habits={customHabits}
          onAdd={addCustomHabit}
          onToggle={(id) => toggleCustomHabit(id, selectedDate)}
          onRemove={removeCustomHabit}
        />

        <SymptomsSection selectedDate={selectedDate} />

        <CheckInSection selectedDate={selectedDate} />

        <RoutineUpdateButton selectedDate={selectedDate} />
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
});
