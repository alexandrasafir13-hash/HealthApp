import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { AdaptivePlan, planDisplayTitle } from '@/types/plan';

type Props = {
  plan: AdaptivePlan;
  onAccept: () => void;
  error: string | null;
};

export default function PlanReviewCard({ plan, onAccept, error }: Props) {
  const week1 = plan.weeks.find((week) => week.weekNumber === 1);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.card} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>{planDisplayTitle(plan)}</Text>
      <Text style={styles.summary}>{plan.goalSummary}</Text>
      <Text style={styles.body}>{plan.startingPoint.summary}</Text>
      <Text style={styles.principle}>{plan.planPrinciple}</Text>

      {week1 != null && (
        <View style={styles.weekBlock}>
          <Text style={styles.weekLabel}>Week 1 — {week1.focus}</Text>
          <Text style={styles.weekTarget}>{week1.target}</Text>
          <Text style={styles.sectionLabel}>Daily check-ins</Text>
          {week1.dailyCheckInQuestions.map((question) => (
            <Text key={question.id} style={styles.question}>
              • {question.question}
            </Text>
          ))}
          {week1.suggestedExperiments.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Optional experiments</Text>
              {week1.suggestedExperiments.map((experiment) => (
                <Text key={experiment.title} style={styles.experiment}>
                  • {experiment.title}
                </Text>
              ))}
            </>
          )}
        </View>
      )}

      <Text style={styles.note}>Weeks 2–4 are provisional and adapt after your weekly review.</Text>

      <Pressable style={styles.acceptButton} onPress={onAccept} accessibilityRole="button">
        <Text style={styles.acceptButtonText}>Start Week 1</Text>
      </Pressable>

      {error != null && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.disclaimer}>Not medical advice.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
    flex: 1,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 10,
    width: '100%',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.slate,
  },
  summary: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.slate,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  principle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.teal,
    fontWeight: '600',
  },
  weekBlock: {
    gap: 8,
    marginTop: 4,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate,
  },
  weekTarget: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate,
    marginTop: 4,
  },
  question: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
  experiment: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateSubtle,
  },
  acceptButton: {
    marginTop: 8,
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  error: {
    fontSize: 13,
    color: palette.high,
  },
  disclaimer: {
    fontSize: 12,
    color: palette.slateSubtle,
  },
});
