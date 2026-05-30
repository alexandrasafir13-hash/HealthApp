import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { DailyCheckInQuestion } from '@/types/plan';
import { palette } from '@/constants/theme';
import { PlanCheckInAnswer } from '@/lib/planCheckInStorage';

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: DailyCheckInQuestion;
  value: PlanCheckInAnswer | undefined;
  onChange: (value: PlanCheckInAnswer) => void;
}) {
  if (question.answerType === 'scale_1_5') {
    const selected = typeof value === 'number' ? value : null;
    return (
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            style={[styles.scaleOption, selected === n && styles.scaleOptionSelected]}
            onPress={() => onChange(n)}>
            <Text style={[styles.scaleText, selected === n && styles.scaleTextSelected]}>{n}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (question.answerType === 'single_choice' && question.options) {
    const selected = typeof value === 'string' ? value : null;
    return (
      <View style={styles.choiceWrap}>
        {question.options.map((option) => (
          <Pressable
            key={option}
            style={[styles.choiceChip, selected === option && styles.choiceChipSelected]}
            onPress={() => onChange(option)}>
            <Text style={[styles.choiceText, selected === option && styles.choiceTextSelected]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (question.answerType === 'multi_choice' && question.options) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <View style={styles.choiceWrap}>
        {question.options.map((option) => {
          const active = selected.includes(option);
          return (
            <Pressable
              key={option}
              style={[styles.choiceChip, active && styles.choiceChipSelected]}
              onPress={() => {
                if (active) onChange(selected.filter((item) => item !== option));
                else onChange([...selected, option]);
              }}>
              <Text style={[styles.choiceText, active && styles.choiceTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const textValue = value == null ? '' : String(value);
  const keyboardType = question.answerType === 'number' ? 'numeric' : 'default';

  return (
    <TextInput
      style={styles.input}
      value={textValue}
      onChangeText={(text) => {
        if (question.answerType === 'number') {
          const parsed = Number.parseFloat(text);
          onChange(Number.isFinite(parsed) ? parsed : text);
        } else {
          onChange(text);
        }
      }}
      keyboardType={keyboardType}
      placeholder="Your answer"
      placeholderTextColor={palette.slateSubtle}
      multiline={question.answerType === 'short_text'}
    />
  );
}

export default function TodayPlanCheckIn() {
  const { personalPlan, activeWeek, todayCheckInDraft, updateCheckInAnswer, isReady } = useHealth();

  if (!isReady || personalPlan == null || activeWeek == null) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.weekLabel}>Week {activeWeek.weekNumber} — {activeWeek.focus}</Text>
      <Text style={styles.target}>{activeWeek.target}</Text>

      {activeWeek.suggestedExperiments.length > 0 && (
        <View style={styles.experiments}>
          <Text style={styles.experimentsLabel}>Optional experiments this week</Text>
          {activeWeek.suggestedExperiments.map((experiment) => (
            <Text key={experiment.title} style={styles.experiment}>
              {experiment.title} — {experiment.description}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.sectionLabel}>Today&apos;s check-in</Text>
      <View style={styles.list}>
        {activeWeek.dailyCheckInQuestions.map((question) => (
          <View key={question.id} style={styles.questionBlock}>
            <Text style={styles.question}>{question.question}</Text>
            <Text style={styles.why}>{question.whyItMatters}</Text>
            <QuestionField
              question={question}
              value={todayCheckInDraft[question.id]}
              onChange={(value) => updateCheckInAnswer(question.id, value)}
            />
          </View>
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
  weekLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.slate,
    lineHeight: 28,
  },
  target: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  experiments: {
    gap: 6,
    backgroundColor: palette.background,
    borderRadius: 12,
    padding: 12,
  },
  experimentsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate,
  },
  experiment: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.slate,
  },
  list: {
    gap: 14,
  },
  questionBlock: {
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.slate,
  },
  why: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: palette.slate,
    backgroundColor: palette.background,
    minHeight: 44,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scaleOption: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  scaleOptionSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  scaleText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate,
  },
  scaleTextSelected: {
    color: palette.tealDark,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: palette.background,
  },
  choiceChipSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate,
  },
  choiceTextSelected: {
    color: palette.tealDark,
  },
});
