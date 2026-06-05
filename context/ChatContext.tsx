import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, ChatSession, PanelOutput, CaseArtifact, CaseArtifactType } from '@/types/chat';
import {
  loadSessions,
  saveSession,
  deleteSession as deleteSessionFromStorage,
  loadCaseArtifacts,
  saveCaseArtifact,
  deleteCaseArtifact as deleteCaseArtifactFromStorage,
} from '@/lib/chatStorage';
import { sendHealthChatMessage, generateTitleForRequest } from '@/lib/healthChat';
import { detectSkill } from '@/lib/skills';
import { useHealth } from '@/context/HealthContext';
import { useAuth } from '@/context/AuthContext';
import { backupUserData } from '@/lib/firebaseSync';
import { loadDocuments } from '@/lib/documentStorage';
import { selectRelevantContext } from '@/lib/contextSelection';
import { confirmDestructiveAction } from '@/lib/confirmDestructiveAction';

// ── Context value type ────────────────────────────────────────────────────────

interface ChatContextValue {
  /** All conversation sessions, newest first */
  sessions: ChatSession[];
  /** Currently open session, null = new chat (empty canvas) */
  activeSessionId: string | null;
  activeSession: ChatSession | null;
  /** Current right-panel content (latest assistant panel output) */
  panelOutput: PanelOutput | null;
  /** Whether a message is in flight */
  isStreaming: boolean;
  /** All case artifacts across all sessions */
  caseArtifacts: CaseArtifact[];
  /** Optional status text during streaming (e.g. 'Scanning documents...') */
  streamStatus: string | null;

  sendMessage: (text: string) => Promise<void>;
  newSession: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  /** Save the current panelOutput as a CaseArtifact */
  saveCurrentPanel: () => Promise<void>;
  savePanel: (panel: PanelOutput, sourceMessageId?: string, skill?: string) => Promise<void>;
  deleteCaseArtifact: (id: string) => Promise<void>;
  /** Clear the right panel manually */
  clearPanel: () => void;
  /** Mark a message as answered (for question cards) */
  markMessageAnswered: (messageId: string) => Promise<void>;
  seedOnboardingSession: (messages: { role: 'user' | 'assistant'; content: string }[]) => Promise<void>;
  toggleSessionSaved: (id: string, isSaved: boolean) => Promise<void>;
  lastViewedSavedConversationsAt: string | null;
  hasUnreadSavedConversations: boolean;
  markSavedConversationsViewed: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sessionTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  return trimmed.length > 50 ? trimmed.slice(0, 48) + '…' : trimmed;
}

function upsertSession(sessions: ChatSession[], session: ChatSession): ChatSession[] {
  const exists = sessions.some((s) => s.id === session.id);
  if (!exists) return [session, ...sessions];
  return sessions.map((s) => (s.id === session.id ? session : s));
}

function userFacingChatError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (/api key/i.test(message)) {
    return 'The AI connection is not configured yet. Your answers are still saved in this chat.';
  }
  if (/empty response|response.*format|length|token/i.test(message)) {
    return 'I saved your answers, but the plan response did not finish. Send “continue” and I will use the answers already in this chat.';
  }
  return 'I saved your message, but could not finish the response. Please try again.';
}

function hasMedicationContext(profile: { medications?: string[] } | null): boolean {
  return (profile?.medications ?? []).length > 0;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { profile, personalPlan, planCheckInLog, checkInLog, isReady, isRestoring } = useHealth();
  const { user, isAuthenticated, signInWithGoogle, setShowAuthModal } = useAuth();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [panelOutput, setPanelOutput] = useState<PanelOutput | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [caseArtifacts, setCaseArtifacts] = useState<CaseArtifact[]>([]);
  const [lastViewedSavedConversationsAt, setLastViewedSavedConversationsAt] = useState<string | null>(null);

  // Ref to the active session id so async callbacks always see the latest value
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeSessionId;

  // Load persisted state on mount
  useEffect(() => {
    if (isRestoring) return;
    Promise.all([
      loadSessions(), 
      loadCaseArtifacts(),
      AsyncStorage.getItem('healthee:last-viewed-saved-conversations')
    ]).then(([s, items, lastViewed]) => {
      setSessions(s);
      setCaseArtifacts(items);
      setLastViewedSavedConversationsAt(lastViewed);
    });
  }, [isRestoring]);

  useEffect(() => {
    if (!isAuthenticated || !user || !profile || !isReady || isRestoring) return;
    backupUserData(user.uid, profile, personalPlan, checkInLog, planCheckInLog).catch((err) => {
      console.error('Error backing up chat data to Firestore:', err);
    });
  }, [
    sessions,
    caseArtifacts,
    isAuthenticated,
    user,
    profile,
    personalPlan,
    checkInLog,
    planCheckInLog,
    isReady,
    isRestoring,
  ]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  // ── Session management ────────────────────────────────────────────────────

  const newSession = useCallback(() => {
    if (!isAuthenticated && sessions.length > 0) {
      Alert.alert(
        `Request Limit Reached`,
        `Log in to save your current request and create new ones, or continue to replace your current request.`,
        [
          { text: `Cancel`, style: 'cancel' },
          { 
            text: `Create Account`, 
            onPress: () => setShowAuthModal(true) 
          },
          { 
            text: `Replace Current`, 
            style: 'destructive',
            onPress: () => {
              sessions.forEach(s => deleteSessionFromStorage(s.id));
              setSessions([]);
              setActiveSessionId(null);
              setPanelOutput(null);
            }
          }
        ]
      );
      return;
    }
    setActiveSessionId(null);
    setPanelOutput(null);
  }, [isAuthenticated, sessions, setShowAuthModal]);

  const selectSession = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      // Restore the last panel output from the last assistant message in this session
      const session = sessions.find((s) => s.id === id);
      if (session) {
        const lastAssistantMsg = [...session.messages]
          .reverse()
          .find((m) => m.role === 'assistant' && m.panel);
        setPanelOutput(lastAssistantMsg?.panel ?? null);
      }
    },
    [sessions],
  );

  const deleteSession = useCallback(async (id: string) => {
    const session = sessions.find((s) => s.id === id);
    const confirmed = await confirmDestructiveAction({
      title: 'Delete conversation?',
      message: `This will permanently delete "${session?.title || 'this conversation'}" from Healthy.`,
      confirmText: 'Delete conversation',
    });
    if (!confirmed) return;

    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      deleteSessionFromStorage(id);
      return next;
    });
    if (activeIdRef.current === id) {
      setActiveSessionId(null);
      setPanelOutput(null);
    }
  }, [sessions]);

  // ── Messaging ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const now = new Date().toISOString();
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: text.trim(),
        createdAt: now,
      };

      // Determine the session — create one if this is a new conversation
      let sessionId = activeIdRef.current;
      let isNew = false;
      let newContextKeys: any = undefined;

      if (!sessionId) {
        if (!isAuthenticated && sessions.length > 0) {
          Alert.alert(
            `Request Limit Reached`,
            `Log in to save your current request and create new ones, or continue to replace your current request.`,
            [
              { text: `Cancel`, style: 'cancel' },
              { 
                text: `Create Account`, 
                onPress: () => setShowAuthModal(true) 
              },
              { 
                text: `Replace Current`, 
                style: 'destructive',
                onPress: () => {
                  sessions.forEach(s => deleteSessionFromStorage(s.id));
                  setSessions([]);
                  setActiveSessionId(null);
                  setPanelOutput(null);
                  sendMessage(text);
                }
              }
            ]
          );
          return;
        }
        sessionId = uid();
        isNew = true;
      }

      const storedSessions = await loadSessions();
      const existingSession = storedSessions.find((s) => s.id === sessionId);
      let workingSession: ChatSession = existingSession
        ? {
          ...existingSession,
          messages: [...existingSession.messages, userMsg],
          updatedAt: now,
        }
        : {
          id: sessionId!,
          title: sessionTitle(text),
          createdAt: now,
          updatedAt: now,
          messages: [userMsg],
        };

      await saveSession(workingSession);
      setSessions((prev) => upsertSession(prev, workingSession));

      if (isNew) {
        setActiveSessionId(sessionId);
      }

      setIsStreaming(true);

      // If new session, determine context dynamically AFTER optimistic update
      if (isNew) {
        // Generate a proper title using the LLM in parallel with context selection
        generateTitleForRequest(text).then((generatedTitle) => {
          if (generatedTitle) {
            setSessions((prev) => {
              const current = prev.find(s => s.id === sessionId);
              if (current && current.title !== generatedTitle) {
                const updated = { ...current, title: generatedTitle };
                saveSession(updated).catch(err => console.warn('Failed to save generated title', err));
                return upsertSession(prev, updated);
              }
              return prev;
            });
          }
        }).catch(err => console.warn('Failed to generate title', err));

        setStreamStatus('Selecting relevant context modules & documents...');
        try {
          const docs = await loadDocuments();
          newContextKeys = await selectRelevantContext(
            text.trim(),
            docs,
            !!profile,
            workingSession.messages,
            hasMedicationContext(profile),
          );
          
          const parts = [];
          if (newContextKeys.profile) parts.push('Profile');
          if (newContextKeys.medication) parts.push('Medication');
          if (newContextKeys.documentIds.length > 0) parts.push(`${newContextKeys.documentIds.length} document(s)`);
          setStreamStatus(`Using context: ${parts.length > 0 ? parts.join(', ') : 'None needed'}`);

          setSessions((prev) => {
            const current = prev.find((s) => s.id === sessionId) || workingSession;
            const updated = { ...current, contextKeys: newContextKeys };
            saveSession(updated).catch(e => console.warn(e));
            return upsertSession(prev, updated);
          });
        } catch (err) {
          console.warn('Failed to get context keys, proceeding with defaults', err);
          newContextKeys = {
            profile: !!profile,
            medication: false,
            documentIds: [],
          };
          setStreamStatus('Thinking...');
        }
      } else {
        setStreamStatus('Checking relevant context...');
        try {
          const docs = await loadDocuments();
          const refreshedContextKeys = await selectRelevantContext(
            text.trim(),
            docs,
            !!profile,
            workingSession.messages,
            hasMedicationContext(profile),
          );
          workingSession = {
            ...workingSession,
            contextKeys: refreshedContextKeys,
          };
          await saveSession(workingSession);
          setSessions((prev) => upsertSession(prev, workingSession));
        } catch (err) {
          console.warn('Failed to refresh context', err);
          workingSession = {
            ...workingSession,
            contextKeys: {
              profile: !!profile,
              medication: false,
              documentIds: [],
            },
          };
        }

        setStreamStatus('Thinking...');
      }

      try {
        const documents = await loadDocuments();

        const result = await sendHealthChatMessage(
          workingSession.messages,
          profile,
          personalPlan,
          planCheckInLog,
          documents,
          isNew ? newContextKeys : workingSession.contextKeys,
        );

        const assistantMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: result.message,
          panel: result.panel ?? undefined,
          questions: result.questions,
          createdAt: new Date().toISOString(),
        };

        // Update panel output if the LLM sent structured content
        if (result.panel) {
          setPanelOutput(result.panel);
          const detectedSkill = detectSkill(workingSession.messages) ?? undefined;
          savePanel(result.panel, assistantMsg.id, detectedSkill).catch(err => console.warn('Failed to auto-save panel', err));
        }

        setSessions((prev) => {
          const current = prev.find((s) => s.id === sessionId) || workingSession;
          const updated: ChatSession = {
            ...current,
            messages: [...current.messages, assistantMsg],
            updatedAt: new Date().toISOString(),
          };
          saveSession(updated).catch((err) => console.warn('Failed to save session', err));
          return upsertSession(prev, updated);
        });
      } catch (err) {
        // Add an error message as the assistant reply
        const errorMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: userFacingChatError(err),
          createdAt: new Date().toISOString(),
        };
        setSessions((prev) => {
          const current = prev.find((s) => s.id === sessionId) || workingSession;
          const updated: ChatSession = {
            ...current,
            messages: [...current.messages, errorMsg],
            updatedAt: new Date().toISOString(),
          };
          saveSession(updated).catch((e) => console.warn('Failed to save session error', e));
          return upsertSession(prev, updated);
        });
      } finally {
        setIsStreaming(false);
        setStreamStatus(null);
      }
    },
    [isStreaming, profile, personalPlan, planCheckInLog, isAuthenticated, sessions, setShowAuthModal],
  );

  const markMessageAnswered = useCallback(async (messageId: string) => {
    const storedSessions = await loadSessions();
    const targetSession = storedSessions.find((s) => s.messages.some((m) => m.id === messageId));
    if (!targetSession) return;

    const updatedMessages = targetSession.messages.map((message) =>
      message.id === messageId ? { ...message, answered: true } : message
    );
    const updatedSession = {
      ...targetSession,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    await saveSession(updatedSession);
    setSessions((prev) => upsertSession(prev, updatedSession));
  }, []);

  const seedOnboardingSession = useCallback(async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
    const firstUserMessage = messages.find((m) => m.role === 'user')?.content?.trim();
    if (!firstUserMessage) return;

    const now = new Date().toISOString();
    const session: ChatSession = {
      id: uid(),
      title: sessionTitle(firstUserMessage),
      createdAt: now,
      updatedAt: now,
      messages: messages.map((message, index) => ({
        id: `${now}-${index}`,
        role: message.role,
        content: message.content,
        createdAt: now,
      })),
      contextKeys: {
        profile: true,
        medication: hasMedicationContext(profile),
        documentIds: [],
      },
    };

    await saveSession(session);
    setSessions((prev) => {
      if (prev.some((existing) => existing.messages[0]?.content === firstUserMessage)) {
        return prev;
      }
      return [session, ...prev];
    });
    setActiveSessionId(session.id);
    setPanelOutput(null);

    // Generate a proper title asynchronously
    generateTitleForRequest(firstUserMessage).then((generatedTitle) => {
      if (generatedTitle) {
        setSessions((prev) => {
          const current = prev.find(s => s.id === session.id);
          if (current && current.title !== generatedTitle) {
            const updated = { ...current, title: generatedTitle };
            saveSession(updated).catch(err => console.warn('Failed to save generated title', err));
            return upsertSession(prev, updated);
          }
          return prev;
        });
      }
    }).catch(err => console.warn('Failed to generate title', err));
  }, []);

  // ── Case Artifacts ───────────────────────────────────────────────────────────

  const savePanel = useCallback(async (panelToSave: PanelOutput, sourceMessageId?: string, skill?: string) => {
    if (!activeIdRef.current) return;

    let mappedType: CaseArtifactType = panelToSave.type as CaseArtifactType;
    if (['plan', 'routine', 'goal', 'checklist'].includes(mappedType)) {
      mappedType = 'plan';
    } else if (mappedType === 'mixed') {
      mappedType = 'insight';
    }

    let isDuplicate = false;
    setCaseArtifacts((prev) => {
      isDuplicate = prev.some(
        (a) =>
          a.sessionId === activeIdRef.current &&
          a.type === mappedType &&
          (sourceMessageId ? a.sourceMessageId === sourceMessageId : a.title === panelToSave.title),
      );
      return prev;
    });

    if (isDuplicate) return;

    const artifact: CaseArtifact = {
      id: uid(),
      sessionId: activeIdRef.current,
      sourceMessageId,
      type: mappedType,
      skill,
      title: panelToSave.title,
      items: panelToSave.items,
      savedAt: new Date().toISOString(),
    };

    await saveCaseArtifact(artifact);
    setCaseArtifacts((prev) => [artifact, ...prev]);
  }, [sessions]);

  const saveCurrentPanel = useCallback(async () => {
    if (!panelOutput || !activeIdRef.current) return;
    await savePanel(panelOutput);
  }, [panelOutput, savePanel]);

  const toggleSessionSaved = useCallback(async (id: string, isSaved: boolean) => {
    if (isSaved && !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setSessions((prev) => {
      const target = prev.find((s) => s.id === id);
      if (!target) return prev;
      const updated = { 
        ...target, 
        isSaved, 
        ...(isSaved ? { savedAt: new Date().toISOString() } : {}) 
      };
      saveSession(updated).catch((err) => console.warn('Failed to save session state', err));
      return upsertSession(prev, updated);
    });
  }, [isAuthenticated, setShowAuthModal]);

  const markSavedConversationsViewed = useCallback(async () => {
    const now = new Date().toISOString();
    setLastViewedSavedConversationsAt(now);
    await AsyncStorage.setItem('healthee:last-viewed-saved-conversations', now);
  }, []);

  const hasUnreadSavedConversations = useMemo(() => {
    return sessions.some(s => s.isSaved && s.savedAt && (!lastViewedSavedConversationsAt || new Date(s.savedAt) > new Date(lastViewedSavedConversationsAt)));
  }, [sessions, lastViewedSavedConversationsAt]);

  const deleteCaseArtifact = useCallback(async (id: string) => {
    const artifact = caseArtifacts.find((i) => i.id === id);
    const confirmed = await confirmDestructiveAction({
      title: 'Delete saved item?',
      message: `This will permanently delete "${artifact?.title || 'this saved item'}" from Healthy.`,
      confirmText: 'Delete saved item',
    });
    if (!confirmed) return;

    await deleteCaseArtifactFromStorage(id);
    setCaseArtifacts((prev) => prev.filter((i) => i.id !== id));
  }, [caseArtifacts]);

  const clearPanel = useCallback(() => setPanelOutput(null), []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = useMemo<ChatContextValue>(
    () => ({
      sessions,
      activeSessionId,
      activeSession,
      panelOutput,
      isStreaming,
      streamStatus,
      caseArtifacts,
      sendMessage,
      newSession,
      selectSession,
      deleteSession,
      saveCurrentPanel,
      savePanel,
      deleteCaseArtifact,
      clearPanel,
      markMessageAnswered,
      seedOnboardingSession,
      toggleSessionSaved,
      lastViewedSavedConversationsAt,
      hasUnreadSavedConversations,
      markSavedConversationsViewed,
    }),
    [
      sessions,
      activeSessionId,
      activeSession,
      panelOutput,
      isStreaming,
      streamStatus,
      caseArtifacts,
      sendMessage,
      newSession,
      selectSession,
      deleteSession,
      saveCurrentPanel,
      savePanel,
      deleteCaseArtifact,
      clearPanel,
      markMessageAnswered,
      seedOnboardingSession,
      toggleSessionSaved,
      lastViewedSavedConversationsAt,
      hasUnreadSavedConversations,
      markSavedConversationsViewed,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
