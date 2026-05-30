import { Activity, Apple, FileUp } from 'lucide-react-native';

import { DataMethodOption, HabitOption, SexOption } from '@/types/onboarding';

export const sexOptions: SexOption[] = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Prefer not to say' },
];

export const dataMethodOptions: DataMethodOption[] = [
  {
    id: 'apple-health',
    title: 'Apple Health',
    description: 'Sleep, heart rate, steps, and workouts from your iPhone and Watch.',
    icon: Apple,
    enabled: false,
  },
  {
    id: 'google-health',
    title: 'Google Health',
    description: 'Sync activity and vitals through Health Connect on Android.',
    icon: Activity,
    enabled: false,
  },
  {
    id: 'upload',
    title: 'Upload documents',
    description: 'Add lab results, doctor notes, or PDF reports.',
    icon: FileUp,
  },
];

export const habitCatalog: HabitOption[] = [
  {
    id: 'morning-sun',
    title: 'Morning sunlight',
    time: '7:30 AM',
    reason: 'Helps steady your sleep-wake rhythm',
  },
  {
    id: 'hydration',
    title: 'Hydration check',
    time: '10:00 AM',
    reason: 'Supports recovery and immune function',
  },
  {
    id: 'movement',
    title: 'Short movement break',
    time: '2:00 PM',
    reason: 'Counters long sitting and stress buildup',
  },
  {
    id: 'wind-down',
    title: 'Wind-down (no screens)',
    time: '9:45 PM',
    reason: 'Protects tonight’s sleep target',
  },
  {
    id: 'evening-checkin',
    title: 'Evening check-in',
    time: '9:00 PM',
    reason: 'Tracks symptoms before they escalate',
  },
  {
    id: 'breathing',
    title: 'Breathing reset',
    time: '3:30 PM',
    reason: 'Lowers stress during afternoon dips',
  },
  {
    id: 'sleep-duration',
    title: 'Sleep (8h-10h)',
    time: '7:00 AM',
    reason: 'Aim for 8–10 hours to support recovery and energy',
  },
  {
    id: 'healthy-meals',
    title: 'Healthy meals',
    time: '12:00 PM',
    reason: 'Nutritious food fuels recovery and immune health',
  },
];
