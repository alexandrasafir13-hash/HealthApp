import { SymbolView } from 'expo-symbols';
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
import { useHealth } from '@/context/HealthContext';
import { dataMethodOptions, habitCatalog } from '@/data/onboardingOptions';
import { palette } from '@/constants/theme';
import { DataMethodId } from '@/types/onboarding';

const STEPS = ['name', 'data', 'habits'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  name: 'Your name',
  data: 'Add your data',
  habits: 'Daily habits',
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useHealth();

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [dataMethods, setDataMethods] = useState<DataMethodId[]>(['manual']);
  const [habitIds, setHabitIds] = useState<string[]>(
    habitCatalog.slice(0, 3).map((h) => h.id)
  );
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const progress = (stepIndex + 1) / STEPS.length;

  const toggleDataMethod = (id: DataMethodId) => {
    setDataMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const toggleHabit = (id: string) => {
    setHabitIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  const canContinue =
    step === 'name'
      ? name.trim().length >= 2
      : step === 'data'
        ? dataMethods.length > 0
        : habitIds.length > 0;

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const goNext = async () => {
    if (!canContinue) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    setSaving(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        dataMethods,
        habitIds,
      });
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Welcome to Healthy</Text>
          <Text style={styles.title}>{STEP_LABELS[step]}</Text>
          <Text style={styles.stepCount}>
            Step {stepIndex + 1} of {STEPS.length}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {step === 'name' && (
            <View style={styles.stepBlock}>
              <Text style={styles.lead}>
                We&apos;ll personalize your daily plan and greetings.
              </Text>
              <Text style={styles.inputLabel}>What should we call you?</Text>
              <TextInput
                style={styles.nameInput}
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

          {step === 'data' && (
            <View style={styles.stepBlock}>
              <Text style={styles.lead}>
                Pick one or more ways to bring health data into Healthy. You can change this later.
              </Text>
              {dataMethodOptions.map((option) => {
                const selected = dataMethods.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => toggleDataMethod(option.id)}>
                    <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                      <SymbolView
                        name={option.icon as 'heart.fill'}
                        tintColor={selected ? palette.teal : palette.slateMuted}
                        size={22}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionBody}>{option.description}</Text>
                    </View>
                    <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
                      {selected && <Text style={styles.optionCheckMark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {step === 'habits' && (
            <View style={styles.stepBlock}>
              <Text style={styles.lead}>
                Choose habits you want to track each day. These show up on your Routine tab.
              </Text>
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
          {stepIndex > 0 ? (
            <Pressable style={styles.backButton} onPress={goBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
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
  flex: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.teal,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.slate,
    marginBottom: 4,
  },
  stepCount: {
    fontSize: 14,
    color: palette.slateMuted,
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
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
    paddingBottom: 16,
  },
  stepBlock: {
    gap: 12,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate,
    marginBottom: 8,
  },
  nameInput: {
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
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
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
    marginBottom: 3,
  },
  optionBody: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  backPlaceholder: {
    width: 72,
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
