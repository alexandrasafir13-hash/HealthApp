import { StyleSheet, Text, View } from 'react-native';

import RoutineChecklistItem from '@/components/RoutineChecklistItem';
import { palette } from '@/constants/theme';
import { actionDoneWhen, dailyActionsFromRoutine, overviewTipsFromRoutine, routineDisplayTitle, PersonalRoutine } from '@/types/routine';

type Props = {
  routine: PersonalRoutine;
  error: string | null;
};

export default function PersonalRoutineCard({ routine, error }: Props) {
  const overviewTips = overviewTipsFromRoutine(routine);
  const dailyActions = dailyActionsFromRoutine(routine);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{routineDisplayTitle(routine)}</Text>
      <Text style={styles.focusLabel}>Focus: {routine.primaryGoalTitle}</Text>
      <Text style={styles.body}>{routine.whyThisGoal}</Text>
      <Text style={styles.intro}>{routine.intro}</Text>

      {overviewTips.length > 0 && (
        <>
          <Text style={styles.subheading}>Overview</Text>
          {overviewTips.map((tip, index) => (
            <Text key={`tip-${index}`} style={styles.tip}>
              • {tip}
            </Text>
          ))}
        </>
      )}

      <Text style={styles.subheading}>Daily checklist</Text>
      {dailyActions.map((action, index) => (
        <View key={`${action.title}-${index}`} style={styles.actionPreview}>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionMeta}>
            {action.timeHint} · Done when: {actionDoneWhen(action)}
          </Text>
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
  subheading: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate,
    marginTop: 4,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
  actionPreview: {
    backgroundColor: palette.background,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate,
  },
  actionMeta: {
    fontSize: 13,
    lineHeight: 18,
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
