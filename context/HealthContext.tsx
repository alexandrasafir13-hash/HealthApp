import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { habitCatalog } from '@/data/onboardingOptions';
import { defaultHabits } from '@/data/mockSources';
import { mockInsights } from '@/data/mockInsights';
import { loadCustomHabits, saveCustomHabits } from '@/lib/customHabitsStorage';
import { loadUserProfile, saveUserProfile } from '@/lib/onboardingStorage';
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
  toggleHabit: (id: string) => void;
  addCustomHabit: (title: string, time: string) => void;
  toggleCustomHabit: (id: string) => void;
  removeCustomHabit: (id: string) => void;
  completeAction: (insightId: string, actionId: string) => void;
  saveCheckIn: (checkIn: Omit<DailyCheckIn, 'date'>) => void;
  completeOnboarding: (input: {
    name: string;
    dataMethods: DataMethodId[];
    habitIds: string[];
  }) => Promise<void>;
  continueAsGuest: () => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | null>(null);

function habitsFromIds(ids: string[]): PreventionHabit[] {
  const selected = habitCatalog.filter((h) => ids.includes(h.id));
  if (selected.length === 0) return defaultHabits;
  return selected.map((h) => ({
    id: h.id,
    title: h.title,
    time: h.time,
    reason: h.reason,
    completed: false,
  }));
}

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState(defaultHabits);
  const [customHabits, setCustomHabits] = useState<CustomHabit[]>([]);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadUserProfile(), loadCustomHabits()]).then(([saved, savedCustom]) => {
      if (!mounted) return;
      if (saved) {
        setProfile(saved);
        setHabits(habitsFromIds(saved.habitIds));
      }
      setCustomHabits(savedCustom);
      setIsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const addCustomHabit = useCallback(
    (title: string, time: string) => {
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
    },
    []
  );

  const toggleCustomHabit = useCallback((id: string) => {
    setCustomHabits((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h));
      void saveCustomHabits(next);
      return next;
    });
  }, []);

  const removeCustomHabit = useCallback((id: string) => {
    setCustomHabits((prev) => {
      const next = prev.filter((h) => h.id !== id);
      void saveCustomHabits(next);
      return next;
    });
  }, []);

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
    []
  );

  const continueAsGuest = useCallback(async () => {
    const nextProfile: UserProfile = {
      name: 'Guest',
      dataMethods: ['manual'],
      habitIds: habitCatalog.slice(0, 3).map((h) => h.id),
      completedAt: new Date().toISOString(),
    };
    await saveUserProfile(nextProfile);
    setProfile(nextProfile);
    setHabits(habitsFromIds(nextProfile.habitIds));
  }, []);

  const value = useMemo<HealthContextValue>(
    () => ({
      insights: mockInsights,
      habits,
      customHabits,
      completedActions,
      todayCheckIn,
      profile,
      onboardingComplete: profile !== null,
      isReady,
      toggleHabit: (id) => {
        setHabits((prev) =>
          prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
        );
      },
      addCustomHabit,
      toggleCustomHabit,
      removeCustomHabit,
      completeAction: (insightId, actionId) => {
        setCompletedActions((prev) => new Set(prev).add(`${insightId}:${actionId}`));
      },
      saveCheckIn: (checkIn) => {
        setTodayCheckIn({
          ...checkIn,
          date: new Date().toISOString().split('T')[0],
        });
      },
      completeOnboarding,
      continueAsGuest,
    }),
    [
      habits,
      customHabits,
      completedActions,
      todayCheckIn,
      profile,
      isReady,
      completeOnboarding,
      continueAsGuest,
      addCustomHabit,
      toggleCustomHabit,
      removeCustomHabit,
    ]
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within HealthProvider');
  return ctx;
}
