import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { useHealth } from '@/context/HealthContext';
import { dataMethodOptions, habitCatalog, sexOptions } from '@/data/onboardingOptions';
import { palette } from '@/constants/theme';
import { BiologicalSex, DataMethodId } from '@/types/onboarding';

const STEPS = ['habits', 'name', 'age', 'sex', 'weight', 'height', 'data'] as const;
type Step = (typeof STEPS)[number];

const STEP_HEADINGS: Record<Step, string> = {
  name: "What's your name?",
  age: 'How old are you?',
  sex: 'What is your sex?',
  weight: 'What is your weight?',
  height: 'What is your height?',
  data: 'How do you want to add data?',
  habits: 'What do you want to improve?',
};

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
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const progress = (stepIndex + 1) / STEPS.length;

  const selectDataMethod = (id: DataMethodId) => {
    const option = dataMethodOptions.find((m) => m.id === id);
    if (option?.enabled === false) return;
    setDataMethod(id);
  };

  const toggleHabit = (id: string) => {
    setHabitIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  const canContinue =
    step === 'name'
      ? name.trim().length >= 2
      : step === 'age'
        ? isAgeValid(age)
        : step === 'sex'
          ? sex != null
          : step === 'weight'
            ? isWeightValid(weight)
            : step === 'height'
              ? isHeightValid(height)
              : step === 'data'
                ? dataMethod != null
                : habitIds.length > 0;

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
    if (stepIndex < STEPS.length - 1) {
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
      });
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={pageStyles.scroll}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.container,
            isTabletUp ? styles.containerTablet : styles.containerPhone,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
          ]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>{STEP_HEADINGS[step]}</Text>

          {step === 'name' && (
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

          {step === 'age' && (
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

          {step === 'sex' && (
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

          {step === 'weight' && (
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

          {step === 'height' && (
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

          {step === 'data' && (
            <View style={styles.stepBlock}>
              {dataMethodOptions.map((option) => {
                const enabled = option.enabled !== false;
                const selected = enabled && dataMethod === option.id;
                const OptionIcon = option.icon;
                const iconColor = !enabled
                  ? palette.slateSubtle
                  : selected
                    ? palette.teal
                    : palette.slateMuted;
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.optionCard,
                      selected && styles.optionCardSelected,
                      !enabled && styles.optionCardDisabled,
                    ]}
                    onPress={() => selectDataMethod(option.id)}
                    disabled={!enabled}
                    accessibilityRole="radio"
                    accessibilityState={{ disabled: !enabled, selected }}>
                    <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                      <OptionIcon color={iconColor} size={22} strokeWidth={2} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, !enabled && styles.optionTitleDisabled]}>
                        {option.title}
                      </Text>
                    </View>
                    <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
                      {selected && <View style={styles.optionRadioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {step === 'habits' && (
            <View style={styles.stepBlock}>
              {habitCatalog.map((habit) => {
                const selected = habitIds.includes(habit.id);
                return (
                  <Pressable
                    key={habit.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => toggleHabit(habit.id)}>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{habit.title}</Text>
                      <Text style={styles.optionBody}>{habit.reason}</Text>
                    </View>
                    <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
                      {selected && <Text style={styles.optionCheckMark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
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
              {stepIndex === STEPS.length - 1
                ? saving
                  ? 'Setting up…'
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
  container: {
    flex: 1,
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
