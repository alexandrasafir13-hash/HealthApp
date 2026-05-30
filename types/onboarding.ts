import type { LucideIcon } from 'lucide-react-native';

export type DataMethodId = 'apple-health' | 'google-health' | 'upload';

export type BiologicalSex = 'female' | 'male' | 'other';

export type MedicalConditionId =
  | 'diabetes'
  | 'kidney-disease'
  | 'recent-surgery'
  | 'heart-condition'
  | 'high-blood-pressure'
  | 'requires-monitoring'
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
  medicalConditionIds: MedicalConditionId[];
  completedAt: string;
}

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
