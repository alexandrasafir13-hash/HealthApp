export type DataMethodId = 'apple-health' | 'google-health' | 'upload' | 'manual';

export interface UserProfile {
  name: string;
  dataMethods: DataMethodId[];
  habitIds: string[];
  completedAt: string;
}

export interface DataMethodOption {
  id: DataMethodId;
  title: string;
  description: string;
  icon: string;
  enabled?: boolean;
}

export interface HabitOption {
  id: string;
  title: string;
  time: string;
  reason: string;
}
