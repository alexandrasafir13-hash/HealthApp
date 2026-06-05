import AsyncStorage from '@react-native-async-storage/async-storage';

import { UserProfile } from '@/types/onboarding';

const PROFILE_KEY = 'healthee:user-profile';

function normalizeProfile(raw: UserProfile): UserProfile {
  return {
    ...raw,
    physicalConcernIds: raw.physicalConcernIds ?? [],
    primaryInterests: raw.primaryInterests ?? [],
    medicalConditions: raw.medicalConditions ?? [],
    medications: raw.medications ?? [],
  };
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return normalizeProfile(JSON.parse(raw) as UserProfile);
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function clearUserProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
