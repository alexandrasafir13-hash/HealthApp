import { StyleSheet, View } from 'react-native';

import RoutineChecklistItem from '@/components/RoutineChecklistItem';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { actionDoneWhen } from '@/types/routine';
import { palette } from '@/constants/theme';

export default function TodayRoutineChecklist() {
  const { personalRoutine, todayRoutineSteps, toggleRoutineStep, isReady } = useHealth();

  if (!isReady || personalRoutine == null) return null;

  const completedCount = todayRoutineSteps.filter((step) => step.completed).length;
  const totalCount = todayRoutineSteps.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.focusLabel}>Focus: {personalRoutine.primaryGoalTitle}</Text>
        <Text style={styles.intro}>{personalRoutine.intro}</Text>
        <Text style={styles.progress}>
          {completedCount} of {totalCount} done today
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Today&apos;s checklist</Text>
      <View style={styles.list}>
        {todayRoutineSteps.map((step) => (
          <RoutineChecklistItem
            key={step.id}
            title={step.title}
            doneWhen={actionDoneWhen(step)}
            timeHint={step.timeHint}
            completed={step.completed}
            onPress={() => toggleRoutineStep(step.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 16,
  },
  header: {
    gap: 8,
  },
  focusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.teal,
  },
  intro: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  progress: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.slate,
  },
  list: {
    gap: 10,
  },
});
