import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { PersonalRoutine } from '@/types/routine';

type Props = {
  routine: PersonalRoutine;
  error: string | null;
};

export default function PersonalRoutineCard({ routine, error }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Your starter routine</Text>
      <Text style={styles.focusLabel}>Focus: {routine.primaryGoalTitle}</Text>
      <Text style={styles.body}>{routine.whyThisGoal}</Text>
      <Text style={styles.intro}>{routine.intro}</Text>

      {routine.steps.map((step, index) => (
        <View key={`${step.title}-${index}`} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.timeHint}>{step.timeHint}</Text>
          </View>
          <Text style={styles.stepBody}>{step.description}</Text>
        </View>
      ))}

      {error != null && <Text style={styles.note}>{error}</Text>}
      <Text style={styles.disclaimer}>Not medical advice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 10,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.slate,
  },
  focusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.teal,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slate,
  },
  stepCard: {
    backgroundColor: palette.background,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate,
  },
  timeHint: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.teal,
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateSubtle,
  },
  disclaimer: {
    fontSize: 12,
    color: palette.slateSubtle,
  },
});
