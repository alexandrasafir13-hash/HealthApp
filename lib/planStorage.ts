import AsyncStorage from '@react-native-async-storage/async-storage';

import { PersonalPlan, PlanGenerationResult } from '@/types/plan';

const PERSONAL_PLAN_KEY = 'healthy:personal-plan';
const PENDING_PLAN_KEY = 'healthy:pending-plan';

export async function loadPersonalPlan(): Promise<PersonalPlan | null> {
  const raw = await AsyncStorage.getItem(PERSONAL_PLAN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersonalPlan;
  } catch {
    return null;
  }
}

export async function savePersonalPlan(plan: PersonalPlan): Promise<void> {
  await AsyncStorage.setItem(PERSONAL_PLAN_KEY, JSON.stringify(plan));
}

export async function loadPendingPlan(): Promise<PlanGenerationResult | null> {
  const raw = await AsyncStorage.getItem(PENDING_PLAN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlanGenerationResult;
  } catch {
    return null;
  }
}

export async function savePendingPlan(result: PlanGenerationResult): Promise<void> {
  await AsyncStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(result));
}

export async function clearPendingPlan(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_PLAN_KEY);
}
