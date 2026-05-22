import { DataSource } from '@/types/health';

export const mockDataSources: DataSource[] = [
  {
    id: 'apple-health',
    name: 'Apple Health',
    icon: 'heart.fill',
    connected: true,
    lastSync: '12 min ago',
    metrics: ['Sleep', 'Steps', 'Heart rate', 'HRV', 'Workouts'],
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    icon: 'circle.circle',
    connected: true,
    lastSync: '12 min ago',
    metrics: ['Sleep stages', 'HRV', 'Body temperature', 'Readiness'],
  },
  {
    id: 'whoop',
    name: 'WHOOP',
    icon: 'waveform.path.ecg',
    connected: false,
    metrics: ['Strain', 'Recovery', 'Sleep performance'],
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: 'figure.walk',
    connected: false,
    metrics: ['Activity', 'Sleep', 'SpO₂'],
  },
  {
    id: 'manual',
    name: 'Manual check-ins',
    icon: 'square.and.pencil',
    connected: true,
    lastSync: 'Today',
    metrics: ['Energy', 'Symptoms', 'Stress'],
  },
];

export const defaultHabits = [
  {
    id: 'h1',
    title: 'Morning sunlight',
    time: '7:30 AM',
    completed: false,
    reason: 'Stabilizes circadian rhythm after short sleep',
  },
  {
    id: 'h2',
    title: 'Hydration check',
    time: '10:00 AM',
    completed: true,
    reason: 'Supports recovery and immune function',
  },
  {
    id: 'h3',
    title: 'Wind-down (no screens)',
    time: '9:45 PM',
    completed: false,
    reason: 'Protects tonight’s sleep target',
  },
  {
    id: 'h4',
    title: 'Evening check-in',
    time: '9:00 PM',
    completed: false,
    reason: 'Tracks symptoms before they escalate',
  },
];
