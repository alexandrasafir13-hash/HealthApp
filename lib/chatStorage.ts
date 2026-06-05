import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatSession, CaseArtifact } from '@/types/chat';

const SESSIONS_KEY = 'healthy:chat-sessions';
const SAVED_ITEMS_KEY = 'healthy:chat-saved-items';

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function loadSessions(): Promise<ChatSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

export async function saveSessions(sessions: ChatSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // ignore write failures silently
  }
}

export async function clearSessions(): Promise<void> {
  await AsyncStorage.removeItem(SESSIONS_KEY);
}

export async function saveSession(session: ChatSession): Promise<void> {
  const sessions = await loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session); // newest first
  }
  await saveSessions(sessions);
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await loadSessions();
  await saveSessions(sessions.filter((s) => s.id !== id));
}

// ── Case artifacts ──────────────────────────────────────────────────────────────

export async function loadCaseArtifacts(): Promise<CaseArtifact[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_ITEMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CaseArtifact[];
  } catch {
    return [];
  }
}

export async function saveCaseArtifacts(items: CaseArtifact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export async function saveCaseArtifact(item: CaseArtifact): Promise<void> {
  const items = await loadCaseArtifacts();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.unshift(item);
  }
  try {
    await AsyncStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export async function deleteCaseArtifact(id: string): Promise<void> {
  const items = await loadCaseArtifacts();
  const filtered = items.filter((i) => i.id !== id);
  try {
    await AsyncStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export async function clearCaseArtifacts(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_ITEMS_KEY);
}
