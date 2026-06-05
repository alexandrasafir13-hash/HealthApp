import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '@/types/onboarding';
import { PersonalPlan } from '@/types/plan';
import { saveUserProfile } from './onboardingStorage';
import { loadPendingPlan, savePendingPlan, savePersonalPlan } from './planStorage';
import { CheckInLog, loadCheckInLog, saveCheckInLog } from './checkInStorage';
import {
  loadPlanCheckInLog,
  PlanCheckInLog,
  savePlanCheckInLog,
} from './planCheckInStorage';
import {
  loadSessions,
  loadCaseArtifacts,
  saveSessions,
  saveCaseArtifacts,
} from './chatStorage';
import { loadDocuments, saveDocuments, DocumentEntry } from './documentStorage';
import { loadProviders, saveProviders, ProviderEntry } from './providerStorage';
import { CaseArtifact, ChatSession } from '@/types/chat';
import { PlanGenerationResult } from '@/types/plan';

export interface UserBackupData {
  profile: UserProfile | null;
  personalPlan: PersonalPlan | null;
  pendingPlan?: PlanGenerationResult | null;
  checkInLog?: CheckInLog;
  planCheckInLog?: PlanCheckInLog;
  chatSessions?: ChatSession[];
  caseArtifacts?: CaseArtifact[];
  documents?: DocumentEntry[];
  providers?: ProviderEntry[];
  updatedAt: string;
}

/**
 * Recursively replace all `undefined` values with `null` so that
 * Firestore's setDoc/updateDoc never receives an unsupported field value.
 */
function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined) return null as unknown as T;
  if (value === null) return null as unknown as T;
  if (Array.isArray(value)) {
    return value.map(sanitizeForFirestore) as unknown as T;
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      result[key] = sanitizeForFirestore((value as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return value;
}

/**
 * Backup the user's profile and plan to Firestore.
 */
export async function backupUserData(
  userId: string, 
  profile: UserProfile | null, 
  personalPlan: PersonalPlan | null,
  checkInLog?: CheckInLog,
  planCheckInLog?: PlanCheckInLog,
): Promise<void> {
  if (!userId) return;

  const docRef = doc(db, 'users', userId);
  const data: UserBackupData = {
    profile,
    personalPlan,
    pendingPlan: await loadPendingPlan(),
    checkInLog: checkInLog ?? await loadCheckInLog(),
    planCheckInLog: planCheckInLog ?? await loadPlanCheckInLog(),
    chatSessions: await loadSessions(),
    caseArtifacts: await loadCaseArtifacts(),
    documents: await loadDocuments(),
    providers: await loadProviders(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, sanitizeForFirestore(data), { merge: true });
}

/**
 * Restore user data from Firestore and sync it to AsyncStorage.
 */
export async function restoreUserData(userId: string): Promise<UserBackupData | null> {
  if (!userId) return null;

  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data() as UserBackupData;

  // Persist restored cloud data to local storage as cache
  if (data.profile) {
    await saveUserProfile(data.profile);
  }
  if (data.personalPlan) {
    await savePersonalPlan(data.personalPlan);
  }
  if (data.pendingPlan) {
    await savePendingPlan(data.pendingPlan);
  }
  if (data.checkInLog) {
    await saveCheckInLog(data.checkInLog);
  }
  if (data.planCheckInLog) {
    await savePlanCheckInLog(data.planCheckInLog);
  }
  if (data.chatSessions) {
    await saveSessions(data.chatSessions);
  }
  if (data.caseArtifacts) {
    await saveCaseArtifacts(data.caseArtifacts);
  }
  if (data.documents) {
    await saveDocuments(data.documents);
  }
  if (data.providers) {
    await saveProviders(data.providers);
  }

  return data;
}
