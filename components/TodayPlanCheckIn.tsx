import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import ActivePlanCard from '@/components/ActivePlanCard';
import TimePickerField from '@/components/TimePickerField';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { DailyCheckInQuestion, questionUnitLabel } from '@/types/plan';
import { palette } from '@/constants/theme';
import { PlanCheckInAnswer } from '@/lib/planCheckInStorage';

function NumberField({
  value,
  unit,
  onChange,
}: {
  value: PlanCheckInAnswer | undefined;
  unit: string | null;
  onChange: (value: PlanCheckInAnswer) => void;
}) {
  const textValue =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string' && value.trim().length > 0
        ? value
        : '';

  return (
    <View style={styles.numberRow}>
      <TextInput
        style={styles.numberInput}
        value={textValue}
        onChangeText={(text) => {
          const cleaned = text.replace(',', '.');
          if (!cleaned.trim()) {
            onChange('');
            return;
          }
          const parsed = Number.parseFloat(cleaned);
          onChange(Number.isFinite(parsed) ? parsed : cleaned);
        }}
        keyboardType="decimal-pad"
        inputMode="decimal"
        placeholder="0"
        placeholderTextColor={palette.slateSubtle}
      />
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: DailyCheckInQuestion;
  value: PlanCheckInAnswer | undefined;
  onChange: (value: PlanCheckInAnswer) => void;
}) {
  const unit = questionUnitLabel(question);

  if (question.answerType === 'time') {
    return <TimePickerField value={value} onChange={onChange} />;
  }

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

  if (question.answerType === 'number') {
    return <NumberField value={value} unit={unit} onChange={onChange} />;
  }

  const textValue = value == null ? '' : String(value);

  return (
    <TextInput
      style={styles.input}
      value={textValue}
      onChangeText={onChange}
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
      <ActivePlanCard
        plan={personalPlan}
        activeWeekNumber={personalPlan.activeWeekNumber}
        showIntro={false}
      />

      <View style={styles.list}>
        {activeWeek.dailyCheckInQuestions.map((question) => (
          <View key={question.id} style={styles.questionBlock}>
            <Text style={styles.question}>{question.question}</Text>
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
  wrap: { width: '100%', gap: 20 },
  list: { gap: 12 },
  questionBlock: {
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
  },
  question: { fontSize: 16, fontWeight: '600', color: palette.slate },
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
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numberInput: {
    flex: 1,
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
  unit: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slateMuted,
    minWidth: 48,
  },
  scaleRow: { flexDirection: 'row', gap: 8 },
  scaleOption: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  scaleOptionSelected: { borderColor: palette.teal, backgroundColor: palette.sageLight },
  scaleText: { fontSize: 15, fontWeight: '600', color: palette.slate },
  scaleTextSelected: { color: palette.tealDark },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: palette.background,
  },
  choiceChipSelected: { borderColor: palette.teal, backgroundColor: palette.sageLight },
  choiceText: { fontSize: 14, fontWeight: '600', color: palette.slate },
  choiceTextSelected: { color: palette.tealDark },
});
