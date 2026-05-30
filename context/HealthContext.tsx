import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { mockInsights } from '@/data/mockInsights';
import { loadCheckInLog, type CheckInLog } from '@/lib/checkInStorage';
import { accountStartDateKey } from '@/lib/dateKeys';
import { applyWeeklyDataToInsights } from '@/lib/deriveWeeklyInsights';
import { generateAdaptivePlan } from '@/lib/generatePersonalRoutine';
import { localDateKey } from '@/lib/localDate';
import { loadUserProfile, saveUserProfile } from '@/lib/onboardingStorage';
import {
  loadPlanCheckInLog,
  PlanCheckInAnswer,
  PlanCheckInLog,
  savePlanCheckInEntry,
} from '@/lib/planCheckInStorage';
import {
  clearPendingPlan,
  loadPendingPlan,
  loadPersonalPlan,
  savePendingPlan,
  savePersonalPlan,
} from '@/lib/planStorage';
import { BodyInsight } from '@/types/health';
import { BiologicalSex, DataMethodId, GoalDetails, MedicalConditionId, UserProfile } from '@/types/onboarding';
import {
  DailyCheckInQuestion,
  getActivePlanWeek,
  PersonalPlan,
  PlanGenerationResult,
  PlanWeek,
} from '@/types/plan';

interface HealthContextValue {
  insights: BodyInsight[];
  completedActions: Set<string>;
  checkInLog: CheckInLog;
  planCheckInLog: PlanCheckInLog;
  personalPlan: PersonalPlan | null;
  pendingPlan: PlanGenerationResult | null;
  planLoading: boolean;
  planError: string | null;
  activeWeek: PlanWeek | null;
  todayCheckInDraft: Record<string, PlanCheckInAnswer>;
  todayCheckInQuestions: DailyCheckInQuestion[];
  todayCheckInCanSubmit: boolean;
  todayCheckInSaved: boolean;
  todayShowInsights: boolean;
  profile: UserProfile | null;
  onboardingComplete: boolean;
  isReady: boolean;
  accountStartDate: string;
  completeAction: (insightId: string, actionId: string) => void;
  updateCheckInAnswer: (questionId: string, value: PlanCheckInAnswer) => void;
  submitPlanCheckIn: () => Promise<boolean>;
  editTodayCheckIn: () => void;
  acceptPlan: () => Promise<void>;
  completeOnboarding: (input: {
    name: string;
    age: number;
    sex: BiologicalSex;
    weightKg: number;
    heightCm: number;
    dataMethods: DataMethodId[];
    habitIds: string[];
    goalDetails?: GoalDetails;
    medicalConditionIds: MedicalConditionId[];
  }) => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | null>(null);

function isAnswerFilled(value: PlanCheckInAnswer | undefined): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return false;
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
  const [todayShowInsights, setTodayShowInsights] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const accountStartDate = useMemo(
    () => accountStartDateKey(profile?.completedAt),
    [profile?.completedAt],
  );

  const buildPlanForProfile = useCallback(async (nextProfile: UserProfile) => {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const result = await generateAdaptivePlan(nextProfile);
      await savePendingPlan(result);
      setPendingPlan(result);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : 'Could not build your plan');
    } finally {
      setPlanLoading(false);
    }
  }, []);

  const acceptPlan = useCallback(async () => {
    if (!pendingPlan) return;
    const plan: PersonalPlan = {
      ...pendingPlan.plan,
      generatedAt: pendingPlan.generatedAt,
      source: pendingPlan.source,
      activeWeekNumber: 1,
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
    ]).then(([saved, savedLog, savedPlan, savedPending, savedPlanCheckIns]) => {
      if (!mounted) return;
      if (saved) setProfile(saved);
      if (savedPlan) setPersonalPlan(savedPlan);
      if (savedPending) setPendingPlan(savedPending);
      setCheckInLog(savedLog);
      setPlanCheckInLog(savedPlanCheckIns);

      const today = localDateKey();
      const savedToday = savedPlanCheckIns[today];
      if (savedToday) {
        setTodayCheckInDraft(savedToday.answers);
        setTodayShowInsights(true);
      }

      setIsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !profile || personalPlan || pendingPlan || planLoading) return;
    if (profile.habitIds.length === 0) return;
    void buildPlanForProfile(profile);
  }, [isReady, profile, personalPlan, pendingPlan, planLoading, buildPlanForProfile]);

  const activeWeek = useMemo(
    () => (personalPlan ? getActivePlanWeek(personalPlan) : null),
    [personalPlan],
  );

  const todayCheckInQuestions = activeWeek?.dailyCheckInQuestions ?? [];

  const todayCheckInCanSubmit = useMemo(() => {
    if (todayCheckInQuestions.length === 0) return false;
    return todayCheckInQuestions
      .filter((question) => question.required)
      .every((question) => isAnswerFilled(todayCheckInDraft[question.id]));
  }, [todayCheckInQuestions, todayCheckInDraft]);

  const todayKey = localDateKey();

  const todayCheckInSaved = planCheckInLog[todayKey]?.submittedAt != null && todayShowInsights;

  const updateCheckInAnswer = useCallback((questionId: string, value: PlanCheckInAnswer) => {
    setTodayCheckInDraft((prev) => ({ ...prev, [questionId]: value }));
    setTodayShowInsights(false);
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
    setTodayShowInsights(true);
    return true;
  }, [personalPlan, activeWeek, todayCheckInCanSubmit, todayCheckInDraft]);

  const editTodayCheckIn = useCallback(() => {
    const today = localDateKey();
    const saved = planCheckInLog[today];
    if (saved) setTodayCheckInDraft(saved.answers);
    setTodayShowInsights(false);
  }, [planCheckInLog]);

  const completeOnboarding = useCallback(
    async (input: {
      name: string;
      age: number;
      sex: BiologicalSex;
      weightKg: number;
      heightCm: number;
      dataMethods: DataMethodId[];
      habitIds: string[];
      goalDetails?: GoalDetails;
      medicalConditionIds: MedicalConditionId[];
    }) => {
      const nextProfile: UserProfile = {
        name: input.name.trim(),
        age: input.age,
        sex: input.sex,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        dataMethods: input.dataMethods,
        habitIds: input.habitIds,
        goalDetails: input.goalDetails ?? {},
        medicalConditionIds: input.medicalConditionIds,
        completedAt: new Date().toISOString(),
      };
      await saveUserProfile(nextProfile);
      setProfile(nextProfile);
      await buildPlanForProfile(nextProfile);
    },
    [buildPlanForProfile],
  );

  const insights = useMemo(
    () =>
      applyWeeklyDataToInsights(mockInsights, {
        checkInLog,
        accountStartDate,
        goalIds: profile?.habitIds ?? [],
      }),
    [checkInLog, accountStartDate, profile?.habitIds],
  );

  const value = useMemo<HealthContextValue>(
    () => ({
      insights,
      completedActions,
      checkInLog,
      planCheckInLog,
      personalPlan,
      pendingPlan,
      planLoading,
      planError,
      activeWeek,
      todayCheckInDraft,
      todayCheckInQuestions,
      todayCheckInCanSubmit,
      todayCheckInSaved,
      todayShowInsights,
      updateCheckInAnswer,
      submitPlanCheckIn,
      editTodayCheckIn,
      acceptPlan,
      profile,
      onboardingComplete: profile !== null,
      isReady,
      accountStartDate,
      completeAction: (insightId, actionId) => {
        setCompletedActions((prev) => new Set(prev).add(`${insightId}:${actionId}`));
      },
      completeOnboarding,
    }),
    [
      insights,
      completedActions,
      checkInLog,
      planCheckInLog,
      personalPlan,
      pendingPlan,
      planLoading,
      planError,
      activeWeek,
      todayCheckInDraft,
      todayCheckInQuestions,
      todayCheckInCanSubmit,
      todayCheckInSaved,
      todayShowInsights,
      updateCheckInAnswer,
      submitPlanCheckIn,
      editTodayCheckIn,
      acceptPlan,
      profile,
      isReady,
      accountStartDate,
      completeOnboarding,
    ],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within HealthProvider');
  return ctx;
}
