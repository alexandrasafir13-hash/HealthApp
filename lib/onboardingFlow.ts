import { habitCatalog } from '@/data/onboardingOptions';
import {
  findGoalQuestion,
  goalQuestionsByHabitId,
  GoalQuestion,
} from '@/data/onboardingGoalQuestions';
import { GoalDetails } from '@/types/onboarding';

const PROFILE_STEPS = ['name', 'age', 'sex', 'weight', 'height', 'conditions'] as const;
export type ProfileStep = (typeof PROFILE_STEPS)[number];

export type OnboardingStep =
  | { kind: 'goals' }
  | { kind: 'goal-detail'; habitId: string; questionId: string }
  | { kind: 'profile'; step: ProfileStep };

export const STEP_HEADINGS: Record<'goals' | ProfileStep, string> = {
  goals: 'What would you like help with?',
  name: "What's your name?",
  age: 'How old are you?',
  sex: 'What is your sex?',
  weight: 'What is your weight?',
  height: 'What is your height?',
  conditions: 'Any underlying medical condition?',
};

export const GOALS_STEP_EXPLAINER =
  'Pick a few areas to focus on. You can change these later.';

export const CONDITIONS_STEP_EXPLAINER =
  'Select all that apply. This helps us tailor insights — not for diagnosis.';

export function buildOnboardingSteps(habitIds: string[]): OnboardingStep[] {
  const steps: OnboardingStep[] = [{ kind: 'goals' }];

  for (const habit of habitCatalog) {
    if (!habitIds.includes(habit.id)) continue;
    const questions = findGoalQuestionsForHabit(habit.id);
    for (const question of questions) {
      steps.push({ kind: 'goal-detail', habitId: habit.id, questionId: question.id });
    }
  }

  for (const step of PROFILE_STEPS) {
    steps.push({ kind: 'profile', step });
  }

  return steps;
}

function findGoalQuestionsForHabit(habitId: string): GoalQuestion[] {
  return goalQuestionsByHabitId[habitId] ?? [];
}

export function goalDetailHeading(habitId: string, questionId: string): string {
  const habit = habitCatalog.find((h) => h.id === habitId);
  const question = findGoalQuestion(habitId, questionId);
  if (!question) return habit?.title ?? 'Your goals';
  return question.title;
}

export function goalDetailExplainer(habitId: string, questionId: string): string | undefined {
  const habit = habitCatalog.find((h) => h.id === habitId);
  const question = findGoalQuestion(habitId, questionId);
  if (question?.explainer) return question.explainer;
  return habit ? `About ${habit.title.toLowerCase()}` : undefined;
}

export function getGoalAnswer(
  goalDetails: GoalDetails,
  habitId: string,
  questionId: string,
): string | string[] | undefined {
  return goalDetails[habitId]?.[questionId];
}

export function isGoalDetailStepValid(
  habitId: string,
  questionId: string,
  goalDetails: GoalDetails,
): boolean {
  const question = findGoalQuestion(habitId, questionId);
  if (!question) return true;

  const value = getGoalAnswer(goalDetails, habitId, questionId);
  if (question.kind === 'number') {
    const n = Number.parseFloat(String(value ?? '').trim().replace(',', '.'));
    return Number.isFinite(n) && n >= 0 && n <= 24;
  }
  if (question.kind === 'single') {
    return typeof value === 'string' && value.length > 0;
  }
  return Array.isArray(value) && value.length > 0;
}
