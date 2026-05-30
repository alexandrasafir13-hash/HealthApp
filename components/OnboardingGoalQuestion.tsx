import { findGoalQuestion, GoalQuestion } from '@/data/onboardingGoalQuestions';
import { palette } from '@/constants/theme';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';

type Props = {
  question: GoalQuestion;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
};

export function OnboardingGoalQuestion({ question, value, onChange }: Props) {
  if (question.kind === 'number') {
    return (
      <TextInput
        style={styles.fieldInput}
        placeholder={question.placeholder ?? 'Enter a number'}
        placeholderTextColor={palette.slateSubtle}
        value={typeof value === 'string' ? value : ''}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        maxLength={4}
      />
    );
  }

  if (question.kind === 'single') {
    return (
      <View style={styles.options}>
        {question.options?.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              style={[styles.optionCard, selected && styles.optionCardSelected]}
              onPress={() => onChange(option.id)}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.label}</Text>
              </View>
              <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
                {selected && <View style={styles.optionRadioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const selectedIds = Array.isArray(value) ? value : [];

  return (
    <View style={styles.options}>
      {question.options?.map((option) => {
        const selected = selectedIds.includes(option.id);
        return (
          <Pressable
            key={option.id}
            style={[styles.optionCard, selected && styles.optionCardSelected]}
            onPress={() => {
              onChange(
                selected
                  ? selectedIds.filter((id) => id !== option.id)
                  : [...selectedIds, option.id],
              );
            }}>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.label}</Text>
            </View>
            <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
              {selected && <Text style={styles.optionCheckMark}>✓</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function getQuestionForStep(habitId: string, questionId: string): GoalQuestion | undefined {
  return findGoalQuestion(habitId, questionId);
}

const styles = StyleSheet.create({
  options: {
    gap: 10,
    width: '100%',
  },
  fieldInput: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: palette.slate,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  optionCardSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.slate,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
  },
  optionRadioSelected: {
    borderColor: palette.teal,
  },
  optionRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.teal,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckSelected: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  optionCheckMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
