import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { mockInsights } from '@/data/mockInsights';
import { loadCheckInLog, type CheckInLog } from '@/lib/checkInStorage';
import { accountStartDateKey } from '@/lib/dateKeys';
import { applyWeeklyDataToInsights } from '@/lib/deriveWeeklyInsights';
import { localDateKey } from '@/lib/localDate';
import { loadUserProfile, saveUserProfile } from '@/lib/onboardingStorage';
import { generateRoutineProposals } from '@/lib/generatePersonalRoutine';
import {
  DailyRoutineProgress,
  loadRoutineCompletionLog,
  RoutineCompletionLog,
  saveRoutineCompletionLog,
} from '@/lib/routineCompletionStorage';
import { normalizePersonalRoutine, withActionIds } from '@/lib/routineSteps';
import {
  clearRoutineProposals,
  loadPersonalRoutine,
  loadRoutineProposals,
  savePersonalRoutine,
  saveRoutineProposals,
} from '@/lib/routineStorage';
import { BodyInsight } from '@/types/health';
import { BiologicalSex, DataMethodId, GoalDetails, MedicalConditionId, UserProfile } from '@/types/onboarding';
import { PersonalRoutine, RoutineProposalSet, RoutineDailyAction, dailyActionsFromRoutine, routineDisplayTitle } from '@/types/routine';

export type TodayRoutineStep = RoutineDailyAction & {
  id: string;
  completed: boolean;
};

interface HealthContextValue {
  insights: BodyInsight[];
  completedActions: Set<string>;
  checkInLog: CheckInLog;
  routineCompletionLog: RoutineCompletionLog;
  todayRoutineSteps: TodayRoutineStep[];
  todayRoutineFinished: boolean;
  todayRoutineCanFinish: boolean;
  profile: UserProfile | null;
  onboardingComplete: boolean;
  isReady: boolean;
  accountStartDate: string;
  completeAction: (insightId: string, actionId: string) => void;
  toggleRoutineStep: (stepId: string) => void;
  finishTodayRoutine: () => Promise<boolean>;
  todayShowInsights: boolean;
  editTodayRoutine: () => void;
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
  personalRoutine: PersonalRoutine | null;
  routineProposals: RoutineProposalSet | null;
  routineLoading: boolean;
  routineError: string | null;
  selectPersonalRoutine: (optionId: string) => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | null>(null);

function emptyProgress(): DailyRoutineProgress {
  return { steps: {} };
}

function todayProgress(log: RoutineCompletionLog, dateKey = localDateKey()): DailyRoutineProgress {
  return log[dateKey] ?? emptyProgress();
}

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [checkInLog, setCheckInLog] = useState<CheckInLog>({});
  const [routineCompletionLog, setRoutineCompletionLog] = useState<RoutineCompletionLog>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalRoutine, setPersonalRoutine] = useState<PersonalRoutine | null>(null);
  const [routineProposals, setRoutineProposals] = useState<RoutineProposalSet | null>(null);
  const [routineLoading, setRoutineLoading] = useState(false);
  const [routineError, setRoutineError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const accountStartDate = useMemo(
    () => accountStartDateKey(profile?.completedAt),
    [profile?.completedAt],
  );

  const buildRoutineProposalsForProfile = useCallback(async (nextProfile: UserProfile) => {
    setRoutineLoading(true);
    setRoutineError(null);
    try {
      const proposals = await generateRoutineProposals(nextProfile);
      await saveRoutineProposals(proposals);
      setRoutineProposals(proposals);
    } catch (e) {
      setRoutineError(e instanceof Error ? e.message : 'Could not build your routines');
    } finally {
      setRoutineLoading(false);
    }
  }, []);

  const selectPersonalRoutine = useCallback(
    async (optionId: string) => {
      const option = routineProposals?.options.find((item) => item.id === optionId);
      if (!option || !routineProposals) return;

      const routine: PersonalRoutine = {
        ...withActionIds(option),
        generatedAt: routineProposals.generatedAt,
        source: routineProposals.source,
      };

      await savePersonalRoutine(routine);
      await clearRoutineProposals();
      setPersonalRoutine(routine);
      setRoutineProposals(null);
      setRoutineError(null);
    },
    [routineProposals],
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadUserProfile(),
      loadCheckInLog(),
      loadPersonalRoutine(),
      loadRoutineProposals(),
      loadRoutineCompletionLog(),
    ]).then(([saved, savedLog, savedRoutine, savedProposals, savedRoutineLog]) => {
      if (!mounted) return;
      if (saved) setProfile(saved);
      if (savedRoutine) {
        const normalized = normalizePersonalRoutine({
          ...savedRoutine,
          title: savedRoutine.title?.trim() || routineDisplayTitle(savedRoutine),
          dailyActions: dailyActionsFromRoutine(savedRoutine as PersonalRoutine & { steps?: RoutineDailyAction[] }),
          overviewTips: savedRoutine.overviewTips ?? [],
        });
        setPersonalRoutine(normalized);
      }
      if (savedProposals) setRoutineProposals(savedProposals);
      setCheckInLog(savedLog);
      setRoutineCompletionLog(savedRoutineLog);
      setIsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !profile || personalRoutine || routineProposals || routineLoading) return;
    if (profile.habitIds.length === 0) return;
    void buildRoutineProposalsForProfile(profile);
  }, [
    isReady,
    profile,
    personalRoutine,
    routineProposals,
    routineLoading,
    buildRoutineProposalsForProfile,
  ]);

  const todayKey = localDateKey();
  const todayRoutineProgress = useMemo(
    () => todayProgress(routineCompletionLog, todayKey),
    [routineCompletionLog, todayKey],
  );

  const todayRoutineSteps = useMemo((): TodayRoutineStep[] => {
    if (!personalRoutine) return [];
    const routine = normalizePersonalRoutine({
      ...personalRoutine,
      dailyActions: dailyActionsFromRoutine(personalRoutine),
    });
    return routine.dailyActions.map((action, index) => {
      const id = action.id?.trim() || `${routine.id}-action-${index}`;
      return {
        ...action,
        id,
        completed: todayRoutineProgress.steps[id] === true,
      };
    });
  }, [personalRoutine, todayRoutineProgress]);

  const todayRoutineFinished = todayRoutineProgress.finishedAt != null;
  const todayRoutineCanFinish = todayRoutineSteps.some((step) => step.completed);
  const todayShowInsights = todayRoutineFinished;

  const persistTodayProgress = useCallback(
    async (progress: DailyRoutineProgress) => {
      const nextLog = { ...routineCompletionLog, [todayKey]: progress };
      setRoutineCompletionLog(nextLog);
      await saveRoutineCompletionLog(nextLog);
    },
    [routineCompletionLog, todayKey],
  );

  const toggleRoutineStep = useCallback(
    (stepId: string) => {
      const current = todayProgress(routineCompletionLog, todayKey);
      const nextCompleted = !current.steps[stepId];
      const nextSteps = { ...current.steps, [stepId]: nextCompleted };
      if (!nextCompleted) delete nextSteps[stepId];
      void persistTodayProgress({
        steps: nextSteps,
        ...(current.finishedAt ? { finishedAt: undefined } : {}),
      });
    },
    [routineCompletionLog, todayKey, persistTodayProgress],
  );

  const finishTodayRoutine = useCallback(async (): Promise<boolean> => {
    if (!todayRoutineCanFinish) return false;
    const current = todayProgress(routineCompletionLog, todayKey);
    await persistTodayProgress({
      ...current,
      finishedAt: new Date().toISOString(),
    });
    return true;
  }, [todayRoutineCanFinish, routineCompletionLog, todayKey, persistTodayProgress]);

  const editTodayRoutine = useCallback(() => {
    const current = todayProgress(routineCompletionLog, todayKey);
    if (!current.finishedAt) return;
    void persistTodayProgress({
      steps: current.steps,
    });
  }, [routineCompletionLog, todayKey, persistTodayProgress]);

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
      await buildRoutineProposalsForProfile(nextProfile);
    },
    [buildRoutineProposalsForProfile],
  );

  const insights = useMemo(
    () =>
      applyWeeklyDataToInsights(mockInsights, {
        checkInLog,
        routineCompletionLog,
        personalRoutine,
        accountStartDate,
        goalIds: profile?.habitIds ?? [],
      }),
    [checkInLog, routineCompletionLog, personalRoutine, accountStartDate, profile?.habitIds],
  );

  const value = useMemo<HealthContextValue>(
    () => ({
      insights,
      completedActions,
      checkInLog,
      routineCompletionLog,
      todayRoutineSteps,
      todayRoutineFinished,
      todayRoutineCanFinish,
      toggleRoutineStep,
      finishTodayRoutine,
      todayShowInsights,
      editTodayRoutine,
      profile,
      onboardingComplete: profile !== null,
      isReady,
      accountStartDate,
      completeAction: (insightId, actionId) => {
        setCompletedActions((prev) => new Set(prev).add(`${insightId}:${actionId}`));
      },
      completeOnboarding,
      personalRoutine,
      routineProposals,
      routineLoading,
      routineError,
      selectPersonalRoutine,
    }),
    [
      insights,
      completedActions,
      checkInLog,
      routineCompletionLog,
      todayRoutineSteps,
      todayRoutineFinished,
      todayRoutineCanFinish,
      toggleRoutineStep,
      finishTodayRoutine,
      todayShowInsights,
      editTodayRoutine,
      profile,
      isReady,
      accountStartDate,
      completeOnboarding,
      personalRoutine,
      routineProposals,
      routineLoading,
      routineError,
      selectPersonalRoutine,
    ],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within HealthProvider');
  return ctx;
}
