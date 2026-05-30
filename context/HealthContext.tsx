import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { habitCatalog } from '@/data/onboardingOptions';
import { defaultHabits } from '@/data/mockSources';
import { mockInsights } from '@/data/mockInsights';
import {
  loadCustomHabitsWithLegacyCompletion,
  saveCustomHabits,
} from '@/lib/customHabitsStorage';
import { loadCheckInLog, saveCheckInLogEntry, type CheckInLog } from '@/lib/checkInStorage';
import { applyWeeklyDataToInsights, buildCheckInForDate } from '@/lib/deriveWeeklyInsights';
import {
  HabitCompletionLog,
  loadHabitCompletions,
  saveHabitCompletions,
} from '@/lib/habitCompletionStorage';
import { localDateKey } from '@/lib/localDate';
import { loadUserProfile, saveUserProfile } from '@/lib/onboardingStorage';
import {
  accountStartDateKey,
  applyHabitCompletions,
  clampDateKey,
  habitCompletionStats,
} from '@/lib/routineDates';
import { BodyInsight, CustomHabit, DailyCheckIn, PreventionHabit } from '@/types/health';
import { DataMethodId, UserProfile } from '@/types/onboarding';

interface HealthContextValue {
  insights: BodyInsight[];
  habits: PreventionHabit[];
  customHabits: CustomHabit[];
  completedActions: Set<string>;
  todayCheckIn: DailyCheckIn | null;
  profile: UserProfile | null;
  onboardingComplete: boolean;
  isReady: boolean;
  accountStartDate: string;
  getHabitsForDate: (dateKey: string) => {
    habits: PreventionHabit[];
    customHabits: CustomHabit[];
    completed: number;
    total: number;
  };
  toggleHabit: (id: string, dateKey?: string) => void;
  addCustomHabit: (title: string, time: string) => void;
  toggleCustomHabit: (id: string, dateKey?: string) => void;
  removeCustomHabit: (id: string) => void;
  completeAction: (insightId: string, actionId: string) => void;
  saveCheckIn: (checkIn: Pick<DailyCheckIn, 'symptoms'>) => void;
  syncRoutineCheckIn: (dateKey?: string) => Promise<DailyCheckIn | null>;
  hasRoutineCheckInData: (dateKey: string) => boolean;
  refreshTodayCheckIn: () => Promise<void>;
  refreshHabitCompletions: () => Promise<void>;
  completeOnboarding: (input: {
    name: string;
    dataMethods: DataMethodId[];
    habitIds: string[];
  }) => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | null>(null);

const ALWAYS_INCLUDED_HABIT_IDS = ['sleep-duration', 'healthy-meals'];

function habitsFromIds(ids: string[]): PreventionHabit[] {
  const mergedIds = [...ids];
  for (const id of ALWAYS_INCLUDED_HABIT_IDS) {
    if (!mergedIds.includes(id)) mergedIds.push(id);
  }
  const selected = habitCatalog.filter((h) => mergedIds.includes(h.id));
  if (selected.length === 0) return defaultHabits;
  const byId = new Map(selected.map((h) => [h.id, h]));
  return mergedIds
    .filter((id) => byId.has(id))
    .map((id) => {
      const habit = byId.get(id)!;
      return {
        id: habit.id,
        title: habit.title,
        time: habit.time,
        reason: habit.reason,
        completed: false,
      };
    });
}

function mergeLegacyCompletions(
  log: HabitCompletionLog,
  legacyIds: string[],
  dateKey: string,
): HabitCompletionLog {
  if (legacyIds.length === 0) return log;
  const day = { ...(log[dateKey] ?? {}) };
  let changed = false;
  for (const id of legacyIds) {
    if (!day[id]) {
      day[id] = true;
      changed = true;
    }
  }
  return changed ? { ...log, [dateKey]: day } : log;
}

function checkInsEqual(a: DailyCheckIn, b: DailyCheckIn): boolean {
  return (
    a.date === b.date &&
    a.energy === b.energy &&
    a.sleepQuality === b.sleepQuality &&
    a.stress === b.stress &&
    a.symptoms.length === b.symptoms.length &&
    a.symptoms.every((s, i) => s === b.symptoms[i])
  );
}

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState(defaultHabits);
  const [customHabits, setCustomHabits] = useState<CustomHabit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletionLog>({});
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [checkInLog, setCheckInLog] = useState<CheckInLog>({});
  const [userSymptoms, setUserSymptoms] = useState<string[]>(['None']);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  const accountStartDate = useMemo(
    () => accountStartDateKey(profile?.completedAt),
    [profile?.completedAt],
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadUserProfile(),
      loadCustomHabitsWithLegacyCompletion(),
      loadCheckInLog(),
      loadHabitCompletions(),
    ]).then(([saved, customLoad, savedLog, savedCompletions]) => {
      if (!mounted) return;
      const today = localDateKey();
      const savedCheckIn = savedLog[today] ?? null;
      const completions = mergeLegacyCompletions(
        savedCompletions,
        customLoad.legacyCompletedIds,
        today,
      );
      if (customLoad.legacyCompletedIds.length > 0) {
        void saveHabitCompletions(completions);
        void saveCustomHabits(customLoad.habits);
      }
      if (saved) {
        setProfile(saved);
        setHabits(habitsFromIds(saved.habitIds));
      }
      setCustomHabits(customLoad.habits);
      setHabitCompletions(completions);
      setCheckInLog(savedLog);
      setUserSymptoms(savedCheckIn?.symptoms ?? ['None']);
      setIsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const getHabitsForDate = useCallback(
    (dateKey: string) => {
      const clamped = clampDateKey(dateKey, accountStartDate, localDateKey());
      const datedHabits = applyHabitCompletions(habits, habitCompletions, clamped);
      const datedCustom = applyHabitCompletions(customHabits, habitCompletions, clamped);
      const ids = [...habits, ...customHabits].map((h) => h.id);
      const { completed, total } = habitCompletionStats(ids, habitCompletions, clamped);
      return { habits: datedHabits, customHabits: datedCustom, completed, total };
    },
    [habits, customHabits, habitCompletions, accountStartDate],
  );

  const toggleHabitForDate = useCallback(
    (id: string, dateKey = localDateKey()) => {
      const clamped = clampDateKey(dateKey, accountStartDate, localDateKey());
      setHabitCompletions((prev) => {
        const day = prev[clamped] ?? {};
        const nextDay = { ...day, [id]: !day[id] };
        const next = { ...prev, [clamped]: nextDay };
        void saveHabitCompletions(next);
        return next;
      });
    },
    [accountStartDate],
  );

  const addCustomHabit = useCallback((title: string, time: string) => {
    const habit: CustomHabit = {
      id: `custom-${Date.now()}`,
      title,
      time,
      completed: false,
    };
    setCustomHabits((prev) => {
      const next = [...prev, habit];
      void saveCustomHabits(next);
      return next;
    });
  }, []);

  const toggleCustomHabit = useCallback(
    (id: string, dateKey = localDateKey()) => {
      toggleHabitForDate(id, dateKey);
    },
    [toggleHabitForDate],
  );

  const removeCustomHabit = useCallback((id: string) => {
    setCustomHabits((prev) => {
      const next = prev.filter((h) => h.id !== id);
      void saveCustomHabits(next);
      return next;
    });
    setHabitCompletions((prev) => {
      const next: HabitCompletionLog = {};
      let changed = false;
      for (const [dateKey, day] of Object.entries(prev)) {
        if (id in day) {
          const { [id]: _, ...rest } = day;
          next[dateKey] = rest;
          changed = true;
        } else {
          next[dateKey] = day;
        }
      }
      if (changed) void saveHabitCompletions(next);
      return changed ? next : prev;
    });
  }, []);

  const refreshHabitCompletions = useCallback(async () => {
    const saved = await loadHabitCompletions();
    setHabitCompletions(saved);
  }, []);

  const refreshTodayCheckIn = useCallback(async () => {
    await refreshHabitCompletions();
  }, [refreshHabitCompletions]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshHabitCompletions();
      }
    });
    return () => sub.remove();
  }, [refreshTodayCheckIn, refreshHabitCompletions]);

  const completeOnboarding = useCallback(
    async (input: { name: string; dataMethods: DataMethodId[]; habitIds: string[] }) => {
      const nextProfile: UserProfile = {
        name: input.name.trim(),
        dataMethods: input.dataMethods,
        habitIds: input.habitIds,
        completedAt: new Date().toISOString(),
      };
      await saveUserProfile(nextProfile);
      setProfile(nextProfile);
      setHabits(habitsFromIds(input.habitIds));
    },
    [],
  );

  const todayHabits = useMemo(() => getHabitsForDate(localDateKey()), [getHabitsForDate]);

  const buildCheckIn = useCallback(
    (dateKey: string, log: CheckInLog = checkInLog) => {
      const clamped = clampDateKey(dateKey, accountStartDate, localDateKey());
      const isToday = clamped === localDateKey();
      return buildCheckInForDate(
        clamped,
        habits,
        customHabits,
        habitCompletions,
        isToday ? {} : log,
        isToday ? userSymptoms : undefined,
      );
    },
    [accountStartDate, habits, customHabits, habitCompletions, checkInLog, userSymptoms],
  );

  const effectiveTodayCheckIn = useMemo((): DailyCheckIn | null => {
    if (!isReady) return null;
    return buildCheckInForDate(
      localDateKey(),
      habits,
      customHabits,
      habitCompletions,
      {},
      userSymptoms,
    );
  }, [isReady, habits, customHabits, habitCompletions, userSymptoms]);

  const syncRoutineCheckIn = useCallback(
    async (dateKey = localDateKey()) => {
      const checkIn = buildCheckIn(dateKey);
      if (!checkIn) return null;
      setCheckInLog((prev) => ({ ...prev, [checkIn.date]: checkIn }));
      await saveCheckInLogEntry(checkIn);
      return checkIn;
    },
    [buildCheckIn],
  );

  const hasRoutineCheckInData = useCallback(
    (dateKey: string) => buildCheckIn(dateKey) != null,
    [buildCheckIn],
  );

  const todayCheckInKey = effectiveTodayCheckIn
    ? `${effectiveTodayCheckIn.date}:${effectiveTodayCheckIn.energy}:${effectiveTodayCheckIn.sleepQuality}:${effectiveTodayCheckIn.stress}:${effectiveTodayCheckIn.symptoms.join('|')}`
    : null;

  useEffect(() => {
    if (!isReady || !effectiveTodayCheckIn) return;
    setCheckInLog((prev) => {
      const existing = prev[effectiveTodayCheckIn.date];
      if (existing && checkInsEqual(existing, effectiveTodayCheckIn)) return prev;
      void saveCheckInLogEntry(effectiveTodayCheckIn);
      return { ...prev, [effectiveTodayCheckIn.date]: effectiveTodayCheckIn };
    });
  }, [isReady, todayCheckInKey, effectiveTodayCheckIn]);

  const insightsCheckInLog = useMemo(() => {
    if (!effectiveTodayCheckIn) return checkInLog;
    return { ...checkInLog, [effectiveTodayCheckIn.date]: effectiveTodayCheckIn };
  }, [checkInLog, effectiveTodayCheckIn]);

  const insights = useMemo(
    () =>
      applyWeeklyDataToInsights(mockInsights, {
        habits,
        customHabits,
        habitCompletions,
        checkInLog: insightsCheckInLog,
        accountStartDate,
      }),
    [habits, customHabits, habitCompletions, insightsCheckInLog, accountStartDate],
  );

  const value = useMemo<HealthContextValue>(
    () => ({
      insights,
      habits: todayHabits.habits,
      customHabits: todayHabits.customHabits,
      completedActions,
      todayCheckIn: effectiveTodayCheckIn,
      profile,
      onboardingComplete: profile !== null,
      isReady,
      accountStartDate,
      getHabitsForDate,
      toggleHabit: toggleHabitForDate,
      addCustomHabit,
      toggleCustomHabit,
      removeCustomHabit,
      completeAction: (insightId, actionId) => {
        setCompletedActions((prev) => new Set(prev).add(`${insightId}:${actionId}`));
      },
      saveCheckIn: ({ symptoms }) => {
        setUserSymptoms(symptoms);
      },
      syncRoutineCheckIn,
      hasRoutineCheckInData,
      refreshTodayCheckIn,
      refreshHabitCompletions,
      completeOnboarding,
    }),
    [
      insights,
      todayHabits,
      effectiveTodayCheckIn,
      completedActions,
      profile,
      isReady,
      accountStartDate,
      getHabitsForDate,
      toggleHabitForDate,
      completeOnboarding,
      addCustomHabit,
      toggleCustomHabit,
      removeCustomHabit,
      syncRoutineCheckIn,
      hasRoutineCheckInData,
      refreshTodayCheckIn,
      refreshHabitCompletions,
    ],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within HealthProvider');
  return ctx;
}
