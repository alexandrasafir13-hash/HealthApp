import { DataSource, DeviceCategoryGroup } from '@/types/health';

export const healthApps: DataSource[] = [
  {
    id: 'apple-health',
    name: 'Apple Health',
    icon: 'heart.fill',
    kind: 'app',
    connected: true,
    lastSync: '12 min ago',
    metrics: ['Sleep', 'Steps', 'Heart rate', 'HRV', 'Workouts'],
  },
  {
    id: 'google-fit',
    name: 'Google Fit',
    icon: 'figure.walk',
    kind: 'app',
    connected: false,
    metrics: ['Activity', 'Heart rate', 'Weight', 'Sleep'],
  },
  {
    id: 'garmin-connect',
    name: 'Garmin Connect',
    icon: 'location.fill',
    kind: 'app',
    connected: false,
    metrics: ['Training load', 'HRV', 'Sleep', 'Body battery'],
  },
  {
    id: 'whoop',
    name: 'WHOOP',
    icon: 'waveform.path.ecg',
    kind: 'app',
    connected: false,
    metrics: ['Strain', 'Recovery', 'Sleep performance'],
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: 'applewatch',
    kind: 'app',
    connected: false,
    metrics: ['Activity', 'Sleep', 'SpO₂', 'Stress'],
  },
  {
    id: 'other-health-app',
    name: 'Other health app',
    icon: 'plus.circle.fill',
    kind: 'app',
    connected: false,
    metrics: ['Import from any compatible app'],
    description: 'Connect any other health or fitness app you use.',
  },
];

export const deviceCategories: DeviceCategoryGroup[] = [
  {
    id: 'smartwatch',
    title: 'Smartwatches',
    devices: [
      {
        id: 'device-apple-watch',
        name: 'Apple Watch',
        icon: 'applewatch',
        kind: 'device',
        connected: false,
        metrics: ['Heart rate', 'HRV', 'Activity', 'Sleep'],
      },
      {
        id: 'device-galaxy-watch',
        name: 'Galaxy Watch',
        icon: 'applewatch',
        kind: 'device',
        connected: false,
        metrics: ['Heart rate', 'Steps', 'Sleep', 'Stress'],
      },
      {
        id: 'device-garmin-watch',
        name: 'Garmin',
        icon: 'location.fill',
        kind: 'device',
        connected: false,
        metrics: ['Training load', 'HRV', 'Sleep', 'Body battery'],
      },
      {
        id: 'device-huawei-watch',
        name: 'Huawei',
        icon: 'applewatch',
        kind: 'device',
        connected: false,
        metrics: ['Heart rate', 'SpO₂', 'Sleep', 'Activity'],
      },
      {
        id: 'device-xiaomi-watch',
        name: 'Xiaomi',
        icon: 'applewatch',
        kind: 'device',
        connected: false,
        metrics: ['Steps', 'Heart rate', 'Sleep', 'Stress'],
      },
    ],
  },
  {
    id: 'diabetes_metabolic',
    title: 'Diabetes & metabolic devices',
    devices: [
      {
        id: 'device-cgm',
        name: 'Continuous glucose monitor',
        icon: 'drop.fill',
        kind: 'device',
        connected: false,
        metrics: ['Glucose trends', 'Time in range', 'Alerts'],
      },
      {
        id: 'device-metabolic-scale',
        name: 'Smart metabolic scale',
        icon: 'scalemass.fill',
        kind: 'device',
        connected: false,
        metrics: ['Weight', 'Body composition', 'Trends'],
      },
    ],
  },
  {
    id: 'heart_cardiovascular',
    title: 'Heart & cardiovascular devices',
    devices: [
      {
        id: 'device-bp-cuff',
        name: 'Blood pressure monitor',
        icon: 'heart.fill',
        kind: 'device',
        connected: false,
        metrics: ['Systolic / diastolic', 'Resting HR', 'Trends'],
      },
      {
        id: 'device-ecg',
        name: 'ECG / heart rhythm monitor',
        icon: 'waveform.path.ecg',
        kind: 'device',
        connected: false,
        metrics: ['Rhythm', 'HRV', 'Alerts'],
      },
    ],
  },
  {
    id: 'respiratory_sleep',
    title: 'Respiratory & sleep devices',
    devices: [
      {
        id: 'device-oura',
        name: 'Oura Ring',
        icon: 'circle.circle',
        kind: 'device',
        connected: true,
        lastSync: '12 min ago',
        metrics: ['Sleep stages', 'HRV', 'Body temperature', 'Readiness'],
      },
      {
        id: 'device-cpap',
        name: 'CPAP / sleep tracker',
        icon: 'bed.double.fill',
        kind: 'device',
        connected: false,
        metrics: ['Sleep quality', 'SpO₂', 'Apnea events'],
      },
    ],
  },
  {
    id: 'neurological',
    title: 'Neurological devices',
    devices: [
      {
        id: 'device-eeg',
        name: 'EEG / brain-sensing wearable',
        icon: 'waveform.path',
        kind: 'device',
        connected: false,
        metrics: ['Focus', 'Stress load', 'Sleep depth'],
      },
    ],
  },
  {
    id: 'elder_care',
    title: 'Elder care & safety',
    devices: [
      {
        id: 'device-fall-sensor',
        name: 'Fall detection sensor',
        icon: 'bell.fill',
        kind: 'device',
        connected: false,
        metrics: ['Movement', 'Alerts', 'Location (optional)'],
      },
    ],
  },
  {
    id: 'womens_health',
    title: "Women's health & fertility",
    devices: [
      {
        id: 'device-cycle-tracker',
        name: 'Cycle & fertility tracker',
        icon: 'calendar',
        kind: 'device',
        connected: false,
        metrics: ['Cycle phase', 'Temperature', 'Symptoms'],
      },
    ],
  },
  {
    id: 'rehab_mobility',
    title: 'Rehabilitation & mobility',
    devices: [
      {
        id: 'device-motion-sensor',
        name: 'Motion & rehab sensor',
        icon: 'figure.cooldown',
        kind: 'device',
        connected: false,
        metrics: ['Range of motion', 'Rep count', 'Recovery progress'],
      },
    ],
  },
];

export const otherDeviceSource: DataSource = {
  id: 'other-device',
  name: 'Other device',
  icon: 'plus.circle.fill',
  kind: 'device',
  connected: false,
  metrics: ['Pair any compatible device'],
  description: 'Connect any other wearable, monitor, or health device you use.',
};

export const manualCheckInSource: DataSource = {
  id: 'manual',
  name: 'Manual check-ins',
  icon: 'square.and.pencil',
  kind: 'manual',
  connected: true,
  lastSync: 'Today',
  metrics: ['Energy', 'Symptoms', 'Stress'],
};

export function getAllDataSources(): DataSource[] {
  const devices = [...deviceCategories.flatMap((c) => c.devices), otherDeviceSource];
  return [...healthApps, ...devices, manualCheckInSource];
}

/** @deprecated Use getAllDataSources */
export const mockDataSources = getAllDataSources();
