import React, { createContext, useContext, useMemo, useState } from 'react';

import { defaultHabits } from '@/data/mockSources';
import { mockInsights } from '@/data/mockInsights';
import { BodyInsight, DailyCheckIn, PreventionHabit } from '@/types/health';

interface HealthContextValue {
  insights: BodyInsight[];
  habits: PreventionHabit[];
  completedActions: Set<string>;
  todayCheckIn: DailyCheckIn | null;
  toggleHabit: (id: string) => void;
  completeAction: (insightId: string, actionId: string) => void;
  saveCheckIn: (checkIn: Omit<DailyCheckIn, 'date'>) => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState(defaultHabits);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);

  const value = useMemo<HealthContextValue>(
    () => ({
      insights: mockInsights,
      habits,
      completedActions,
      todayCheckIn,
      toggleHabit: (id) => {
        setHabits((prev) =>
          prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
        );
      },
      completeAction: (insightId, actionId) => {
        setCompletedActions((prev) => new Set(prev).add(`${insightId}:${actionId}`));
      },
      saveCheckIn: (checkIn) => {
        setTodayCheckIn({
          ...checkIn,
          date: new Date().toISOString().split('T')[0],
        });
      },
    }),
    [habits, completedActions, todayCheckIn]
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within HealthProvider');
  return ctx;
}
