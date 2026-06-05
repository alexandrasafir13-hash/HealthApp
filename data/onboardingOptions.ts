import { DataMethodOption, HabitOption, SexOption } from '@/types/onboarding';

export const sexOptions: SexOption[] = [
  { id: 'female', label: 'Feminin' },
  { id: 'male', label: 'Masculin' },
  { id: 'other', label: 'Altul' },
  { id: 'prefer-not-say', label: 'Prefer să nu spun' },
];

export const dataMethodOptions: DataMethodOption[] = [];


export const habitCatalog: HabitOption[] = [
  {
    id: 'sleep-schedule',
    title: 'Dormi mai bine',
    time: '10:30 PM',
    reason: 'Construiește o rutină de seară mai calmă',
  },
  {
    id: 'exercise-routine',
    title: 'Mișcă-te mai mult',
    time: '7:00 AM',
    reason: 'Adaugă mișcare simplă în ziua ta',
  },
  {
    id: 'eating-habits',
    title: 'Mănâncă mai bine',
    time: '12:00 PM',
    reason: 'Fă alegerile alimentare mai ușoare',
  },
  {
    id: 'hydration',
    title: 'Hidratează-te',
    time: '10:00 AM',
    reason: 'Ține aportul de apă sub control',
  },
  {
    id: 'screen-time',
    title: 'Folosește mai puțin telefonul',
    time: '9:00 PM',
    reason: 'Creează mai mult timp liniștit',
  },
];

/** Goals picked during onboarding — used for personalized recommendations, not daily checklists. */
export const goalCatalog = habitCatalog;
