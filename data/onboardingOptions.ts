import { Activity, Apple, FileUp } from 'lucide-react-native';

import { DataMethodOption, HabitOption, MedicalConditionId, MedicalConditionOption, SexOption } from '@/types/onboarding';

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

export const medicalConditionCatalog: MedicalConditionOption[] = [
  {
    id: 'diabetes',
    title: 'Diabetes',
    description: 'Type 1, type 2, or prediabetes',
  },
  {
    id: 'kidney-disease',
    title: 'Kidney disease or dysfunction',
    description: 'Reduced kidney function or related conditions',
  },
  {
    id: 'recent-surgery',
    title: 'Recent surgery',
    description: 'Within the past 12 months',
  },
  {
    id: 'heart-condition',
    title: 'Heart condition',
    description: 'Heart disease, arrhythmia, or related issues',
  },
  {
    id: 'high-blood-pressure',
    title: 'High blood pressure',
    description: 'Hypertension or related cardiovascular risk',
  },
  {
    id: 'autoimmune-chronic',
    title: 'Autoimmune or chronic illness',
    description: 'Long-term conditions such as thyroid, arthritis, or IBD',
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Another condition not listed here',
  },
  {
    id: 'none',
    title: 'None of the above',
    description: 'No underlying conditions to report',
  },
];

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
