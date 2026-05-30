import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { getQuestionForStep, OnboardingGoalQuestion } from '@/components/OnboardingGoalQuestion';
import { PAGE_MAX_WIDTH } from '@/hooks/useBreakpoint';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { useHealth } from '@/context/HealthContext';
import { habitCatalog, medicalConditionCatalog, sexOptions } from '@/data/onboardingOptions';
import {
  buildOnboardingSteps,
  CONDITIONS_STEP_EXPLAINER,
  getGoalAnswer,
  goalDetailExplainer,
  goalDetailHeading,
  GOALS_STEP_EXPLAINER,
  isGoalDetailStepValid,
  OnboardingStep,
  STEP_HEADINGS,
} from '@/lib/onboardingFlow';
import { palette } from '@/constants/theme';
import { BiologicalSex, DataMethodId, GoalDetails, MedicalConditionId } from '@/types/onboarding';

const PROFILE_STEP = (step: OnboardingStep) => step.kind === 'profile' ? step.step : null;

function parsePositiveInt(value: string): number | null {
  const n = Number.parseInt(value.trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function parsePositiveDecimal(value: string): number | null {
  const n = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function isAgeValid(age: string) {
  const ageNum = parsePositiveInt(age);
  return ageNum != null && ageNum >= 13 && ageNum <= 120;
}

function isWeightValid(weight: string) {
  const weightKg = parsePositiveDecimal(weight);
  return weightKg != null && weightKg >= 30 && weightKg <= 300;
}

function isHeightValid(height: string) {
  const heightCm = parsePositiveDecimal(height);
  return heightCm != null && heightCm >= 100 && heightCm <= 250;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { isTabletUp } = usePageLayout();
  const router = useRouter();
  const { completeOnboarding } = useHealth();

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<BiologicalSex | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [dataMethod, setDataMethod] = useState<DataMethodId>('upload');
  const [habitIds, setHabitIds] = useState<string[]>([]);
  const [goalDetails, setGoalDetails] = useState<GoalDetails>({});
  const [medicalConditionIds, setMedicalConditionIds] = useState<MedicalConditionId[]>([]);
  const [saving, setSaving] = useState(false);

  const steps = useMemo(() => buildOnboardingSteps(habitIds), [habitIds]);
  const step = steps[stepIndex] ?? steps[0];
  const progress = steps.length > 0 ? (stepIndex + 1) / steps.length : 0;
  const profileStep = PROFILE_STEP(step);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [stepIndex, steps.length]);

  const toggleHabit = (id: string) => {
    setHabitIds((prev) => {
      const next = prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id];
      if (!next.includes(id)) {
        setGoalDetails((details) => {
          const { [id]: _, ...rest } = details;
          return rest;
        });
      }
      return next;
    });
  };

  const setGoalAnswer = (habitId: string, questionId: string, value: string | string[]) => {
    setGoalDetails((prev) => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        [questionId]: value,
      },
    }));
  };

  const toggleMedicalCondition = (id: MedicalConditionId) => {
    setMedicalConditionIds((prev) => {
      if (id === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const withoutNone = prev.filter((item) => item !== 'none');
      return withoutNone.includes(id)
        ? withoutNone.filter((item) => item !== id)
        : [...withoutNone, id];
    });
  };

  const canContinue =
    step.kind === 'goals'
      ? habitIds.length > 0
      : step.kind === 'goal-detail'
        ? isGoalDetailStepValid(step.habitId, step.questionId, goalDetails)
        : profileStep === 'name'
          ? name.trim().length >= 2
          : profileStep === 'age'
            ? isAgeValid(age)
            : profileStep === 'sex'
              ? sex != null
              : profileStep === 'weight'
                ? isWeightValid(weight)
                : profileStep === 'height'
                  ? isHeightValid(height)
                  : profileStep === 'conditions'
                    ? medicalConditionIds.length > 0
                    : false;

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  };

  const goNext = async () => {
    if (!canContinue) return;
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    const ageNum = parsePositiveInt(age);
    const weightKg = parsePositiveDecimal(weight);
    const heightCm = parsePositiveDecimal(height);
    if (ageNum == null || weightKg == null || heightCm == null || sex == null) return;

    setSaving(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        age: ageNum,
        sex,
        weightKg,
        heightCm,
        dataMethods: [dataMethod],
        habitIds,
        goalDetails,
        medicalConditionIds,
      });
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[pageStyles.scroll, styles.screen]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.container,
            isTabletUp ? styles.containerTablet : styles.containerPhone,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, maxWidth: PAGE_MAX_WIDTH },
          ]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>
            {step.kind === 'goal-detail'
              ? goalDetailHeading(step.habitId, step.questionId)
              : step.kind === 'profile'
                ? STEP_HEADINGS[step.step]
                : STEP_HEADINGS.goals}
          </Text>
          {step.kind === 'goals' && (
            <Text style={styles.stepExplainer}>{GOALS_STEP_EXPLAINER}</Text>
          )}
          {step.kind === 'goal-detail' && (
            <Text style={styles.stepExplainer}>
              {goalDetailExplainer(step.habitId, step.questionId)}
            </Text>
          )}
          {profileStep === 'conditions' && (
            <Text style={styles.stepExplainer}>{CONDITIONS_STEP_EXPLAINER}</Text>
          )}

          {profileStep === 'name' && (
            <View style={styles.stepBlock}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Your first name"
                placeholderTextColor={palette.slateSubtle}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={canContinue ? goNext : undefined}
              />
            </View>
          )}

          {profileStep === 'age' && (
            <View style={styles.stepBlock}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Age"
                placeholderTextColor={palette.slateSubtle}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                maxLength={3}
                returnKeyType="next"
                onSubmitEditing={canContinue ? goNext : undefined}
              />
            </View>
          )}

          {profileStep === 'sex' && (
            <View style={styles.stepBlock}>
              <View style={styles.sexOptions}>
                {sexOptions.map((option) => {
                  const selected = sex === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[styles.sexOption, selected && styles.sexOptionSelected]}
                      onPress={() => setSex(option.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}>
                      <Text style={[styles.sexOptionText, selected && styles.sexOptionTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {profileStep === 'weight' && (
            <View style={styles.stepBlock}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Weight (kg)"
                placeholderTextColor={palette.slateSubtle}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                returnKeyType="next"
                onSubmitEditing={canContinue ? goNext : undefined}
              />
            </View>
          )}

          {profileStep === 'height' && (
            <View style={styles.stepBlock}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Height (cm)"
                placeholderTextColor={palette.slateSubtle}
                value={height}
                onChangeText={setHeight}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={canContinue ? goNext : undefined}
              />
            </View>
          )}

          {profileStep === 'conditions' && (
            <View style={styles.stepBlock}>
              {medicalConditionCatalog.map((condition) => {
                const selected = medicalConditionIds.includes(condition.id);
                return (
                  <Pressable
                    key={condition.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => toggleMedicalCondition(condition.id)}>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{condition.title}</Text>
                      <Text style={styles.optionBody}>{condition.description}</Text>
                    </View>
                    <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
                      {selected && <Text style={styles.optionCheckMark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {step.kind === 'goals' && (
            <View style={styles.stepBlock}>
              {habitCatalog.map((goal) => {
                const selected = habitIds.includes(goal.id);
                return (
                  <Pressable
                    key={goal.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => toggleHabit(goal.id)}>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{goal.title}</Text>
                      <Text style={styles.optionBody}>{goal.reason}</Text>
                    </View>
                    <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
                      {selected && <Text style={styles.optionCheckMark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {step.kind === 'goal-detail' && (() => {
            const question = getQuestionForStep(step.habitId, step.questionId);
            if (!question) return null;
            return (
              <View style={styles.stepBlock}>
                <OnboardingGoalQuestion
                  question={question}
                  value={getGoalAnswer(goalDetails, step.habitId, step.questionId)}
                  onChange={(value) => setGoalAnswer(step.habitId, step.questionId, value)}
                />
              </View>
            );
          })()}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Pressable
            style={[styles.nextButton, (!canContinue || saving) && styles.nextButtonDisabled]}
            onPress={goNext}
            disabled={!canContinue || saving}>
            <Text style={styles.nextButtonText}>
              {stepIndex === steps.length - 1
                ? saving
                  ? 'Building your options…'
                  : 'Get started'
                : 'Continue'}
            </Text>
          </Pressable>
        </View>
        </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  containerPhone: {
    paddingHorizontal: 20,
  },
  containerTablet: {
    paddingHorizontal: 32,
  },
  progressTrack: {
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.teal,
    borderRadius: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.slate,
    marginBottom: 20,
    width: '100%',
  },
  stepExplainer: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
    marginTop: -8,
    marginBottom: 20,
    width: '100%',
  },
  stepBlock: {
    gap: 12,
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
  sexOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sexOption: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  sexOptionSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  sexOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate,
    textAlign: 'center',
  },
  sexOptionTextSelected: {
    color: palette.tealDark,
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
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  optionCardDisabled: {
    opacity: 0.45,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: palette.card,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.slate,
  },
  optionTitleDisabled: {
    color: palette.slateSubtle,
  },
  optionBody: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitTime: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.teal,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    width: '100%',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.slateMuted,
  },
  nextButton: {
    flex: 1,
    backgroundColor: palette.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
