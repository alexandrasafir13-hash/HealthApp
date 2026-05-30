import AsyncStorage from '@react-native-async-storage/async-storage';

import { PersonalRoutine, RoutineProposalSet } from '@/types/routine';

const ROUTINE_KEY = 'healthy:personal-routine';
const PROPOSALS_KEY = 'healthy:routine-proposals';

export async function loadPersonalRoutine(): Promise<PersonalRoutine | null> {
  const raw = await AsyncStorage.getItem(ROUTINE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersonalRoutine;
  } catch {
    return null;
  }
}

export async function savePersonalRoutine(routine: PersonalRoutine): Promise<void> {
  await AsyncStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
}

export async function loadRoutineProposals(): Promise<RoutineProposalSet | null> {
  const raw = await AsyncStorage.getItem(PROPOSALS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoutineProposalSet;
  } catch {
    return null;
  }
}

export async function saveRoutineProposals(proposals: RoutineProposalSet): Promise<void> {
  await AsyncStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
}

export async function clearRoutineProposals(): Promise<void> {
  await AsyncStorage.removeItem(PROPOSALS_KEY);
}

export async function clearPersonalRoutine(): Promise<void> {
  await AsyncStorage.removeItem(ROUTINE_KEY);
}
