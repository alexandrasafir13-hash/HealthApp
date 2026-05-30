import type { LucideIcon } from 'lucide-react-native';

export type DataMethodId = 'apple-health' | 'google-health' | 'upload';

export type BiologicalSex = 'female' | 'male' | 'other';

export type MedicalConditionId =
  | 'diabetes'
  | 'kidney-disease'
  | 'recent-surgery'
  | 'heart-condition'
  | 'high-blood-pressure'
  | 'autoimmune-chronic'
  | 'other'
  | 'none';

export interface UserProfile {
  name: string;
  age: number;
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  dataMethods: DataMethodId[];
  habitIds: string[];
  /** Answers to goal-specific onboarding questions, keyed by habit id then question id. */
  goalDetails?: GoalDetails;
  medicalConditionIds: MedicalConditionId[];
  completedAt: string;
}

/** habitId -> questionId -> answer (string for single/number, string[] for multi). */
export type GoalDetails = Record<string, Record<string, string | string[]>>;

export interface SexOption {
  id: BiologicalSex;
  label: string;
}

export interface DataMethodOption {
  id: DataMethodId;
  title: string;
  description: string;
  icon: LucideIcon;
  enabled?: boolean;
}

export interface HabitOption {
  id: string;
  title: string;
  time: string;
  reason: string;
}

export interface MedicalConditionOption {
  id: MedicalConditionId;
  title: string;
  description: string;
}
