export { getAllDataSources, mockDataSources } from '@/data/dataSources';

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
