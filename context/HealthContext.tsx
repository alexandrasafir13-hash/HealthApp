import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearCheckInLog, loadCheckInLog, type CheckInLog } from '@/lib/checkInStorage';
import { accountStartDateKey } from '@/lib/dateKeys';
import { adaptProvisionalWeek } from '@/lib/generatePersonalRoutine';
import { localDateKey, setSimulatedOffset } from '@/lib/localDate';
import { loadUserProfile, saveUserProfile, clearUserProfile } from '@/lib/onboardingStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { backupUserData, restoreUserData } from '@/lib/firebaseSync';
import {
  loadPlanCheckInLog,
  PlanCheckInAnswer,
  PlanCheckInLog,
  clearPlanCheckInLog,
  savePlanCheckInLog,
  savePlanCheckInEntry,
} from '@/lib/planCheckInStorage';
import {
  clearPendingPlan,
  clearPersonalPlan,
  loadPendingPlan,
  loadPersonalPlan,
  savePersonalPlan,
} from '@/lib/planStorage';
import { clearSessions, clearCaseArtifacts } from '@/lib/chatStorage';
import { clearDocuments } from '@/lib/documentStorage';
import { clearProviders } from '@/lib/providerStorage';

import { UserProfile } from '@/types/onboarding';
import {
  DailyCheckInQuestion,
  PersonalPlan,
  PlanGenerationResult,
  PlanWeek,
  normalizeStoredPlan,
  PlanPhase,
  getDaysDifference,
  isAnswerFilled,
} from '@/types/plan';

interface HealthContextValue {
  completedActions: Set<string>;
  checkInLog: CheckInLog;
  planCheckInLog: PlanCheckInLog;
  personalPlan: PersonalPlan | null;
  pendingPlan: PlanGenerationResult | null;
  planLoading: boolean;
  planError: string | null;
  activeWeek: PlanWeek | null;
  activePhase: PlanPhase | null;
  todayCheckInDraft: Record<string, PlanCheckInAnswer>;
  todayCheckInQuestions: DailyCheckInQuestion[];
  todayCheckInCanSubmit: boolean;
  todayCheckInSaved: boolean;
  profile: UserProfile | null;
  isReady: boolean;
  /** True while a Firestore cloud restore is in-flight. Index waits on this before routing. */
  isRestoring: boolean;
  accountStartDate: string;
  completeAction: (insightId: string, actionId: string) => void;
  updateCheckInAnswer: (questionId: string, value: PlanCheckInAnswer) => void;
  submitPlanCheckIn: () => Promise<boolean>;
  acceptPlan: () => Promise<void>;
  updateProfile: (updatedFields: Partial<UserProfile>) => Promise<void>;
  resetAllData: () => Promise<void>;
  simulatedOffsetDays: number;
  changeSimulatedOffsetDays: (days: number) => Promise<void>;
  updateActiveWeekNumber: (weekNumber: number) => Promise<void>;
  adaptCurrentWeek: (weekNumber: number) => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | null>(null);

function checkInAnswersMatch(
  saved: Record<string, PlanCheckInAnswer>,
  draft: Record<string, PlanCheckInAnswer>,
): boolean {
  return JSON.stringify(saved) === JSON.stringify(draft);
}

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [checkInLog, setCheckInLog] = useState<CheckInLog>({});
  const [planCheckInLog, setPlanCheckInLog] = useState<PlanCheckInLog>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalPlan, setPersonalPlan] = useState<PersonalPlan | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanGenerationResult | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [todayCheckInDraft, setTodayCheckInDraft] = useState<Record<string, PlanCheckInAnswer>>({});
  const [isReady, setIsReady] = useState(false);
  const [simulatedOffsetDays, setSimulatedOffsetDaysState] = useState(0);
  // Starts true — index.tsx waits until we've settled auth state and any cloud restore.
  // Only becomes false once we know for certain whether a restore is needed and it's done.
  const [isRestoring, setIsRestoring] = useState(true);
  const hasRestoredRef = React.useRef(false);

  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Single effect that resolves isRestoring correctly for ALL cases:
  //  - auth still loading → do nothing yet (isRestoring stays true)
  //  - auth resolved, not authenticated → no restore needed, clear immediately
  //  - auth resolved, authenticated → run restore, then clear
  useEffect(() => {
    if (authLoading) return; // Wait until Firebase reports definitive auth state

    if (!isAuthenticated || !user) {
      // Not signed in — no restore needed
      setIsRestoring(false);
      return;
    }

    if (hasRestoredRef.current) return; // Already restored this session
    hasRestoredRef.current = true;

    restoreUserData(user.uid)
      .then((restored) => {
        if (restored) {
          if (restored.profile) setProfile(restored.profile);
          if (restored.personalPlan) setPersonalPlan(restored.personalPlan);
          if (restored.pendingPlan) setPendingPlan(restored.pendingPlan);
          if (restored.checkInLog) setCheckInLog(restored.checkInLog);
          if (restored.planCheckInLog) {
            setPlanCheckInLog(restored.planCheckInLog);
            const savedToday = restored.planCheckInLog[localDateKey()];
            setTodayCheckInDraft(savedToday?.answers ?? {});
          }
        }
      })
      .catch((err) => {
        console.error('Error restoring data from Firestore:', err);
      })
      .finally(() => {
        setIsRestoring(false);
      });
  }, [authLoading, isAuthenticated, user]);

  // Backup to Firestore on changes — only after restore is done and only if there's a profile worth saving
  useEffect(() => {
    if (isAuthenticated && user && isReady && !isRestoring && hasRestoredRef.current && profile) {
      backupUserData(user.uid, profile, personalPlan, checkInLog, planCheckInLog).catch((err) => {
        console.error('Error backing up to Firestore:', err);
      });
    }
  }, [profile, personalPlan, pendingPlan, checkInLog, planCheckInLog, isAuthenticated, user, isReady, isRestoring]);

  const accountStartDate = useMemo(
    () => accountStartDateKey(profile?.completedAt),
    [profile?.completedAt],
  );



  const acceptPlan = useCallback(async () => {
    if (!pendingPlan) return;
    const plan: PersonalPlan = {
      ...normalizeStoredPlan(pendingPlan.plan),
      generatedAt: pendingPlan.generatedAt,
      source: pendingPlan.source,
      activePhaseId: pendingPlan.plan.phases?.[0]?.id || 'phase-1',
      activeWeekNumber: 1,
      startedAt: localDateKey(),
    };
    await savePersonalPlan(plan);
    await clearPendingPlan();
    setPersonalPlan(plan);
    setPendingPlan(null);
    setPlanError(null);
  }, [pendingPlan]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadUserProfile(),
      loadCheckInLog(),
      loadPersonalPlan(),
      loadPendingPlan(),
      loadPlanCheckInLog(),
      AsyncStorage.getItem('healthee:simulated-offset-days'),
    ]).then(([saved, savedLog, savedPlan, savedPending, savedPlanCheckIns, savedOffset]) => {
      if (!mounted) return;
      if (savedOffset != null) {
        const parsed = parseInt(savedOffset, 10);
        if (!Number.isNaN(parsed)) {
          void setSimulatedOffset(parsed);
          setSimulatedOffsetDaysState(parsed);
        }
      }
      if (saved) setProfile(saved);
      if (savedPlan) {
        let planStartKey = savedPlan.startedAt;
        if (!planStartKey) {
          try {
            const d = savedPlan.generatedAt ? new Date(savedPlan.generatedAt) : new Date();
            planStartKey = localDateKey(Number.isNaN(d.getTime()) ? new Date() : d);
          } catch {
            planStartKey = localDateKey();
          }
        }
        setPersonalPlan({
          ...normalizeStoredPlan(savedPlan),
          generatedAt: savedPlan.generatedAt,
          source: savedPlan.source,
          activePhaseId: savedPlan.activePhaseId || savedPlan.phases?.[0]?.id || 'phase-1',
          activeWeekNumber: savedPlan.activeWeekNumber,
          startedAt: planStartKey,
        });
      }
      if (savedPending) {
        setPendingPlan({
          ...savedPending,
          plan: normalizeStoredPlan(savedPending.plan),
        });
      }
      setCheckInLog(savedLog);
      setPlanCheckInLog(savedPlanCheckIns);

      const today = localDateKey();
      const savedToday = savedPlanCheckIns[today];
      if (savedToday) {
        setTodayCheckInDraft(savedToday.answers);
      }

      setIsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);



  const derivedPersonalPlan = useMemo<PersonalPlan | null>(() => {
    if (!personalPlan) return null;
    let planStartKey = personalPlan.startedAt;
    
    if (!planStartKey || planStartKey.includes('NaN')) {
      if (personalPlan.generatedAt) {
        try {
          const d = new Date(personalPlan.generatedAt);
          if (!Number.isNaN(d.getTime())) {
            planStartKey = localDateKey(d);
          }
        } catch {}
      }
      if (!planStartKey || planStartKey.includes('NaN')) {
        planStartKey = localDateKey(); // Fallback to simulated today
      }
    }
    
    const todayKey = localDateKey();
    const diffDays = getDaysDifference(planStartKey, todayKey);
    
    let accumulatedDays = 0;
    let activePhaseId = personalPlan.phases?.[0]?.id || 'phase-1';
    let phaseIdx = 0;
    
    if (personalPlan.phases && personalPlan.phases.length > 0) {
      for (let i = 0; i < personalPlan.phases.length; i++) {
        accumulatedDays += personalPlan.phases[i].durationDays;
        if (diffDays < accumulatedDays) {
          activePhaseId = personalPlan.phases[i].id;
          phaseIdx = i;
          break;
        }
        if (i === personalPlan.phases.length - 1) {
          activePhaseId = personalPlan.phases[i].id;
          phaseIdx = i;
        }
      }
    }
    
    const weekNumber = phaseIdx + 1;

    if (personalPlan.activeWeekNumber === weekNumber && personalPlan.activePhaseId === activePhaseId) {
      return personalPlan;
    }
    return {
      ...personalPlan,
      activeWeekNumber: weekNumber,
      activePhaseId,
    };
  }, [personalPlan, simulatedOffsetDays]);

  const activePhase = useMemo<PlanPhase | null>(() => {
    if (!derivedPersonalPlan || !derivedPersonalPlan.phases) return null;
    return derivedPersonalPlan.phases.find((p) => p.id === derivedPersonalPlan.activePhaseId) || derivedPersonalPlan.phases[0] || null;
  }, [derivedPersonalPlan]);

  const activeWeek = useMemo<PlanWeek | null>(() => {
    if (!activePhase) return null;
    const isProvisional = activePhase.status === 'provisional' || ((activePhase.actions?.length === 0 || activePhase.checkInQuestions?.length === 0) && (derivedPersonalPlan?.activeWeekNumber ?? 1) > 1);
    return {
      weekNumber: derivedPersonalPlan?.activeWeekNumber ?? 1,
      status: isProvisional ? 'provisional' : 'active',
      focus: activePhase.title,
      weeklyTarget: activePhase.purpose,
      whyThisWeek: activePhase.purpose,
      planSteps: activePhase.actions.map(a => `${a.trigger ? `${a.trigger} → ` : ''}${a.action}${a.duration ? ` → ${a.duration}` : ''}`),
      planForTheWeek: activePhase.dailyUserWork,
      experiments: [],
      dailyCheckInQuestions: activePhase.checkInQuestions,
      weeklyReviewSignals: activePhase.signals.map(s => s.label),
    };
  }, [activePhase, derivedPersonalPlan]);

  const todayCheckInQuestions = activeWeek?.dailyCheckInQuestions ?? [];

  const todayCheckInCanSubmit = useMemo(() => {
    if (activeWeek?.status === 'provisional') return false;
    if (todayCheckInQuestions.length === 0) return false;
    return todayCheckInQuestions
      .filter((question) => question.required)
      .every((question) => isAnswerFilled(todayCheckInDraft[question.id]));
  }, [todayCheckInQuestions, todayCheckInDraft, activeWeek?.status]);

  const todayKey = useMemo(() => localDateKey(), [simulatedOffsetDays]);

  const todayCheckInSaved = useMemo(() => {
    const entry = planCheckInLog[todayKey];
    if (!entry?.submittedAt) return false;
    return checkInAnswersMatch(entry.answers, todayCheckInDraft);
  }, [planCheckInLog, todayKey, todayCheckInDraft]);

  const updateCheckInAnswer = useCallback((questionId: string, value: PlanCheckInAnswer) => {
    setTodayCheckInDraft((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const submitPlanCheckIn = useCallback(async (): Promise<boolean> => {
    if (!personalPlan || !activeWeek || !todayCheckInCanSubmit) return false;
    const today = localDateKey();
    const entry = {
      date: today,
      weekNumber: activeWeek.weekNumber,
      answers: todayCheckInDraft,
      submittedAt: new Date().toISOString(),
    };
    setPlanCheckInLog((prev) => ({ ...prev, [today]: entry }));
    await savePlanCheckInEntry(entry);
    return true;
  }, [personalPlan, activeWeek, todayCheckInCanSubmit, todayCheckInDraft]);

  const updateProfile = useCallback(
    async (updatedFields: Partial<UserProfile>) => {
      if (!profile) return;
      const nextProfile: UserProfile = {
        ...profile,
        ...updatedFields,
        name: updatedFields.name !== undefined ? updatedFields.name?.trim() : profile.name,
      };
      await saveUserProfile(nextProfile);
      setProfile(nextProfile);
    },
    [profile],
  );

  // Auto-fill profile name from authenticated Google user if currently empty
  useEffect(() => {
    if (isAuthenticated && user && isReady && profile && !profile.name && user.displayName) {
      void updateProfile({ name: user.displayName });
    }
  }, [isAuthenticated, user, isReady, profile, updateProfile]);

  const changeSimulatedOffsetDays = useCallback(
    async (days: number) => {
      await setSimulatedOffset(days);
      setSimulatedOffsetDaysState(days);

      // Refresh draft answers for the new simulated today date key
      const newToday = localDateKey();
      const savedToday = planCheckInLog[newToday];
      if (savedToday) {
        setTodayCheckInDraft(savedToday.answers);
      } else {
        setTodayCheckInDraft({});
      }
    },
    [planCheckInLog],
  );

  const updateActiveWeekNumber = useCallback(
    async (weekNumber: number) => {
      if (!derivedPersonalPlan) return;
      const planStartKey = derivedPersonalPlan.startedAt || localDateKey(new Date(derivedPersonalPlan.generatedAt));
      
      const targetDate = new Date(planStartKey + 'T00:00:00');
      targetDate.setDate(targetDate.getDate() + (weekNumber - 1) * 7);
      
      const liveToday = new Date();
      liveToday.setHours(0, 0, 0, 0);
      
      const targetTime = targetDate.getTime();
      const liveTime = liveToday.getTime();
      const diffDays = Math.round((targetTime - liveTime) / (1000 * 60 * 60 * 24));
      
      await changeSimulatedOffsetDays(diffDays);
    },
    [derivedPersonalPlan, changeSimulatedOffsetDays],
  );

  const adaptCurrentWeek = useCallback(
    async (weekNumber: number) => {
      if (!profile || !personalPlan) return;
      setPlanLoading(true);
      setPlanError(null);
      try {
        const previousWeekEntries = Object.values(planCheckInLog).filter(
          (entry) => entry.weekNumber === weekNumber - 1,
        );
        const adaptedWeek = await adaptProvisionalWeek(
          profile,
          personalPlan,
          weekNumber,
          previousWeekEntries,
        );
        
        const parsedSteps = Array.isArray(adaptedWeek.planSteps) ? adaptedWeek.planSteps : [];
        const actions = parsedSteps.map((step, idx) => {
          let trigger: string | null = null;
          let action: string = step;
          let duration: string | null = null;
          let parts = step.split('→').map((p) => p.trim());
          if (parts.length !== 3) parts = step.split('->').map((p) => p.trim());
          if (parts.length === 3) {
            trigger = parts[0];
            action = parts[1];
            duration = parts[2];
          }
          return {
            id: `action-${weekNumber}-${idx + 1}`,
            label: action,
            trigger,
            action,
            duration,
            required: true,
          };
        });

        const newPhase: PlanPhase = {
          id: `phase-${weekNumber}`,
          status: 'active' as const,
          title: adaptedWeek.focus,
          purpose: adaptedWeek.weeklyTarget,
          durationDays: 7,
          entryCondition: `Phase ${weekNumber - 1} complete`,
          exitCondition: `End of phase ${weekNumber}`,
          dailyUserWork: adaptedWeek.planForTheWeek,
          actions,
          checkInQuestions: adaptedWeek.dailyCheckInQuestions,
          signals: adaptedWeek.weeklyReviewSignals.map((sig, idx) => ({
            id: `signal-${weekNumber}-${idx + 1}`,
            label: sig,
            computedFromQuestionId: adaptedWeek.dailyCheckInQuestions[idx]?.id || adaptedWeek.dailyCheckInQuestions[0]?.id || `w${weekNumber}-observe-step`,
            direction: 'higher_is_better' as const,
          })),
          reviewRule: {
            reviewAfterDays: 7,
            progressLooksGoodWhen: 'Consistent daily completion',
            progressLooksMixedWhen: 'Some partial completion',
            progressLooksPoorWhen: 'Low active logging',
          }
        };

        const updatedPhases = personalPlan.phases.map((p, idx) =>
          idx + 1 === weekNumber ? newPhase : p
        );
        
        const updatedPlan: PersonalPlan = {
          ...personalPlan,
          phases: updatedPhases,
        };
        
        await savePersonalPlan(updatedPlan);
        setPersonalPlan(updatedPlan);
      } catch (e) {
        setPlanError(e instanceof Error ? e.message : 'Could not adapt your week');
      } finally {
        setPlanLoading(false);
      }
    },
    [profile, personalPlan, planCheckInLog],
  );

  const resetAllData = useCallback(async () => {
    await clearUserProfile();
    await clearPendingPlan();
    await clearPersonalPlan();
    await clearCheckInLog();
    await clearPlanCheckInLog();
    await clearSessions();
    await clearCaseArtifacts();
    await clearDocuments();
    await clearProviders();
    await AsyncStorage.removeItem('healthee:simulated-offset-days');
    await setSimulatedOffset(0);
    setSimulatedOffsetDaysState(0);
    setProfile(null);
    setPersonalPlan(null);
    setPendingPlan(null);
    setCheckInLog({});
    setPlanCheckInLog({});
    setCompletedActions(new Set());
    setTodayCheckInDraft({});
  }, []);



  const value = useMemo<HealthContextValue>(
    () => ({
      completedActions,
      checkInLog,
      planCheckInLog,
      personalPlan: derivedPersonalPlan,
      pendingPlan,
      planLoading,
      planError,
      activeWeek,
      activePhase,
      todayCheckInDraft,
      todayCheckInQuestions,
      todayCheckInCanSubmit,
      todayCheckInSaved,
      updateCheckInAnswer,
      submitPlanCheckIn,
      acceptPlan,
      profile,
      isReady,
      isRestoring,
      accountStartDate,
      completeAction: (insightId, actionId) => {
        setCompletedActions((prev) => new Set(prev).add(`${insightId}:${actionId}`));
      },
      updateProfile,
      resetAllData,
      simulatedOffsetDays,
      changeSimulatedOffsetDays,
      updateActiveWeekNumber,
      adaptCurrentWeek,
    }),
    [
      completedActions,
      checkInLog,
      planCheckInLog,
      derivedPersonalPlan,
      pendingPlan,
      planLoading,
      planError,
      activeWeek,
      activePhase,
      todayCheckInDraft,
      todayCheckInQuestions,
      todayCheckInCanSubmit,
      todayCheckInSaved,
      updateCheckInAnswer,
      submitPlanCheckIn,
      acceptPlan,
      profile,
      isReady,
      isRestoring,
      accountStartDate,
      updateProfile,
      resetAllData,
      simulatedOffsetDays,
      changeSimulatedOffsetDays,
      updateActiveWeekNumber,
      adaptCurrentWeek,
    ],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within HealthProvider');
  return ctx;
}
