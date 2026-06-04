import { DataMethodOption, HabitOption, SexOption } from '@/types/onboarding';

export const sexOptions: SexOption[] = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Other' },
  { id: 'prefer-not-say', label: 'Prefer not to say' },
];

export const dataMethodOptions: DataMethodOption[] = [];


export const habitCatalog: HabitOption[] = [
  {
    id: 'sleep-schedule',
    title: 'Sleep better',
    time: '10:30 PM',
    reason: 'Build a calmer bedtime routine',
  },
  {
    id: 'exercise-routine',
    title: 'Move more',
    time: '7:00 AM',
    reason: 'Add simple activity to your day',
  },
  {
    id: 'eating-habits',
    title: 'Eat better',
    time: '12:00 PM',
    reason: 'Make food choices easier',
  },
  {
    id: 'hydration',
    title: 'Stay hydrated',
    time: '10:00 AM',
    reason: 'Keep your intake on track',
  },
  {
    id: 'screen-time',
    title: 'Use your phone less',
    time: '9:00 PM',
    reason: 'Create more quiet time',
  },
];

/** Goals picked during onboarding — used for personalized recommendations, not daily checklists. */
export const goalCatalog = habitCatalog;
