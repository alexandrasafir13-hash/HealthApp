import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Check, Send } from 'lucide-react-native';

import TimePickerField from '@/components/TimePickerField';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { usePageLayout } from '@/hooks/usePageLayout';
import { DailyCheckInQuestion, questionUnitLabel, isAnswerFilled } from '@/types/plan';
import { palette, cardShadow } from '@/constants/theme';
import { PlanCheckInAnswer } from '@/lib/planCheckInStorage';

function NumberField({
  value,
  unit,
  onChange,
  onSubmit,
}: {
  value: PlanCheckInAnswer | undefined;
  unit: string | null;
  onChange: (value: PlanCheckInAnswer) => void;
  onSubmit?: () => void;
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
        style={[styles.fieldInput, { flex: 1 }]}
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
        placeholder="Enter value"
        placeholderTextColor={palette.slateSubtle}
        onSubmitEditing={onSubmit}
        blurOnSubmit={false}
      />
      {unit ? <Text style={styles.unit} numberOfLines={1}>{unit}</Text> : null}
    </View>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  onSubmit,
}: {
  question: DailyCheckInQuestion;
  value: PlanCheckInAnswer | undefined;
  onChange: (value: PlanCheckInAnswer) => void;
  onSubmit?: () => void;
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
      <View style={styles.optionsList}>
        {question.options.map((option) => {
          const isSelected = selected === option;
          return (
            <Pressable
              key={option}
              style={[styles.optionChip, isSelected && styles.optionChipSelected]}
              onPress={() => onChange(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}>
              <View style={styles.optionChipInner}>
                <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                  {option}
                </Text>
                <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorSelected]}>
                  {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (question.answerType === 'multi_choice' && question.options) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <View style={styles.optionsList}>
        {question.options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <Pressable
              key={option}
              style={[styles.optionChip, isSelected && styles.optionChipSelected]}
              onPress={() => {
                if (isSelected) {
                  onChange(selected.filter((item) => item !== option));
                } else {
                  onChange([...selected, option]);
                }
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}>
              <View style={styles.optionChipInner}>
                <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                  {option}
                </Text>
                <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorSelected]}>
                  {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (question.answerType === 'number') {
    return <NumberField value={value} unit={unit} onChange={onChange} onSubmit={onSubmit} />;
  }

  const textValue = value == null ? '' : String(value);
  const isMultiline = question.answerType === 'short_text';

  return (
    <TextInput
      style={[styles.fieldInput, isMultiline && styles.textAreaInput]}
      value={textValue}
      onChangeText={onChange}
      placeholder="Your answer..."
      placeholderTextColor={palette.slateSubtle}
      multiline={isMultiline}
      numberOfLines={isMultiline ? 4 : 1}
      onSubmitEditing={!isMultiline ? onSubmit : undefined}
      returnKeyType={!isMultiline ? 'done' : undefined}
      blurOnSubmit={!isMultiline}
    />
  );
}

export default function TodayPlanCheckIn() {
  const { isTabletUp } = usePageLayout();
  const {
    personalPlan,
    activeWeek,
    todayCheckInDraft,
    updateCheckInAnswer,
    submitPlanCheckIn,
    todayCheckInCanSubmit,
    isReady,
  } = useHealth();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (!isReady || personalPlan == null || activeWeek == null) return null;

  const questions = activeWeek.dailyCheckInQuestions;
  if (questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = todayCheckInDraft[currentQuestion.id];

  const isCurrentAnswerFilled = isAnswerFilled(currentAnswer);
  const isStepDisabled = currentQuestion.required && !isCurrentAnswerFilled;
  const isLastStep = currentQuestionIndex === questions.length - 1;

  const handleNext = async () => {
    if (isStepDisabled) return;
    if (isLastStep) {
      if (!todayCheckInCanSubmit) return;
      setSubmitting(true);
      try {
        await submitPlanCheckIn();
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.optionsContainer}>
      {/* Cohesive Progress Indicator Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Step Header */}
      <View style={styles.wizardBadge}>
        <Text style={styles.wizardBadgeText}>
          QUESTION {currentQuestionIndex + 1} OF {questions.length}
          {currentQuestion.required ? ' • REQUIRED' : ' • OPTIONAL'}
        </Text>
      </View>
      <View style={styles.wizardHeader}>
        <Text style={styles.wizardQuestionText}>{currentQuestion.question}</Text>
      </View>

      {/* Question Form Input Field */}
      <View style={styles.inputArea}>
        <QuestionField
          question={currentQuestion}
          value={currentAnswer}
          onChange={(value) => updateCheckInAnswer(currentQuestion.id, value)}
          onSubmit={handleNext}
        />
      </View>

      {/* Navigation Buttons Tray */}
      <View style={styles.wizardNavTray}>
        {currentQuestionIndex > 0 ? (
          <Pressable
            style={styles.wizardBackButton}
            onPress={handleBack}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.wizardBackButtonText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ width: 0 }} />
        )}

        <Pressable
          style={[
            styles.wizardNextButton,
            isStepDisabled && styles.wizardNextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={isStepDisabled || submitting}
          accessibilityRole="button"
          accessibilityLabel={isLastStep ? 'Submit check-in' : 'Go to next question'}>
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : isLastStep ? (
            <>
              <Send size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.wizardNextButtonText}>Submit Check-in</Text>
            </>
          ) : (
            <Text style={styles.wizardNextButtonText}>Next</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    ...cardShadow,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E2E8E6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.teal,
    borderRadius: 3,
  },
  wizardBadge: {
    backgroundColor: palette.sageLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  wizardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.tealDark,
    letterSpacing: 1,
  },
  wizardHeader: {
    marginBottom: 20,
  },
  wizardQuestionText: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.slate,
    lineHeight: 28,
  },
  inputArea: {
    width: '100%',
    marginVertical: 4,
  },
  optionsList: {
    width: '100%',
  },
  optionChip: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: palette.background,
  },
  optionChipSelected: {
    backgroundColor: palette.sageLight,
  },
  optionChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionChipText: {
    fontSize: 16,
    color: palette.slate,
    fontWeight: '600',
  },
  optionChipTextSelected: {
    color: palette.tealDark,
    fontWeight: '700',
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selectionIndicatorSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.teal,
  },
  fieldInput: {
    backgroundColor: palette.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.slate,
    width: '100%',
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  unit: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slateMuted,
    flexShrink: 0,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  scaleOption: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  scaleOptionSelected: {
    backgroundColor: palette.sageLight,
  },
  scaleText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate,
  },
  scaleTextSelected: {
    color: palette.tealDark,
    fontWeight: '700',
  },
  wizardNavTray: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    gap: 12,
  },
  wizardBackButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardBackButtonText: {
    fontSize: 15,
    color: palette.tealDark,
    fontWeight: '700',
  },
  wizardNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: palette.teal,
    minWidth: 80,
  },
  wizardNextButtonDisabled: {
    opacity: 0.4,
  },
  wizardNextButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});
