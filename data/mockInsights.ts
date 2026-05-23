import { BodyInsight } from '@/types/health';

export const mockInsights: BodyInsight[] = [
  {
    id: 'sleep-debt-1',
    title: 'Sleep debt is building',
    summary: 'You averaged 5.8 hours over 3 nights. Recovery and immunity are likely affected.',
    summaryHighlights: [
      { text: 'You averaged ', tone: 'body' },
      {
        text: '5.8 hours',
        metric: { value: 5.8, min: 2, max: 10, unit: 'h', goodMin: 7, cautionMin: 5.5 },
      },
      { text: ' over ', tone: 'body' },
      { text: '3 nights', tone: 'body' },
      { text: '. ', tone: 'body' },
      { text: 'Recovery', tone: 'body' },
      { text: ' and ', tone: 'body' },
      { text: 'Immunity', tone: 'body' },
      { text: ' are likely affected.', tone: 'body' },
    ],
    category: 'sleep',
    severity: 'high',
    cause: {
      headline: 'Short sleep streak',
      detail:
        'Your wearable shows 3 consecutive nights under 6 hours, with late bedtimes after 11:30 PM.',
      signals: ['Avg sleep: 5h 48m', 'Bedtime drift: +47 min', 'Deep sleep: −18%'],
    },
    effect: {
      headline: 'Body runs in conservation mode',
      detail:
        'Less deep sleep raises cortisol and slows immune cell production. You may feel foggy and catch colds more easily.',
      bodySignals: ['Higher resting heart rate', 'Slower HRV recovery', 'Lower daytime energy'],
    },
    actions: [
      {
        id: 'a1',
        title: 'Tonight: lights out by 10:30 PM',
        description: 'Set a 30-minute wind-down alarm. Dim screens and keep the room cool (65–68°F).',
        duration: 'Tonight',
        priority: 1,
      },
      {
        id: 'a2',
        title: 'No caffeine after 2 PM',
        description: 'Caffeine half-life is ~5 hours; cutting afternoon intake protects sleep pressure.',
        duration: '3 days',
        priority: 2,
      },
      {
        id: 'a3',
        title: '10-minute morning sunlight',
        description: 'Outdoor light within an hour of waking resets your circadian clock.',
        duration: 'Daily',
        priority: 3,
      },
    ],
    connectedMetrics: ['Sleep duration', 'HRV', 'Resting HR'],
    confidence: 87,
    detectedAt: new Date().toISOString(),
  },
  {
    id: 'hrv-dip-1',
    title: 'Recovery is lagging',
    summary: 'Heart rate variability dropped 14% vs your baseline. Your body may still be stressed from recent load.',
    summaryHighlights: [
      { text: 'Heart rate variability dropped ', tone: 'body' },
      {
        text: '14%',
        metric: {
          value: 14,
          min: 0,
          max: 30,
          unit: '%',
          display: '−14%',
          lowerIsBetter: true,
          goodMax: 5,
          cautionMax: 12,
        },
      },
      {
        text: ' vs your baseline. Your body may still be stressed from recent load.',
        tone: 'body',
      },
    ],
    category: 'recovery',
    severity: 'medium',
    cause: {
      headline: 'Training + poor sleep overlap',
      detail: 'Two harder workouts this week combined with short sleep created a recovery deficit.',
      signals: ['HRV: −14%', 'Resting HR: +4 bpm', 'Workout strain: Elevated'],
    },
    effect: {
      headline: 'Autonomic nervous system stays sympathetic',
      detail:
        'Your “fight or flight” branch stays active longer, which diverts energy from repair and digestion.',
      bodySignals: ['Muscle soreness lingers', 'Mood irritability', 'Slower workout gains'],
    },
    actions: [
      {
        id: 'b1',
        title: 'Active recovery day',
        description: 'Walk 20–30 min, stretch, skip high-intensity training for 24–48 hours.',
        duration: 'Today',
        priority: 1,
      },
      {
        id: 'b2',
        title: 'Hydrate + electrolytes',
        description: 'Target 2–2.5 L water today; add sodium/potassium if you trained hard.',
        duration: 'Today',
        priority: 2,
      },
    ],
    connectedMetrics: ['HRV', 'Workout load', 'Sleep'],
    confidence: 79,
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'immunity-watch-1',
    title: 'Prevention',
    summary: 'Resting heart rate is elevated with slightly lower SpO₂. Worth acting early before symptoms peak.',
    summaryHighlights: [
      { text: 'Resting heart rate is elevated ', tone: 'body' },
      {
        text: '+6 bpm',
        metric: {
          value: 6,
          min: 0,
          max: 15,
          unit: 'bpm',
          display: '+6 bpm',
          lowerIsBetter: true,
          goodMax: 2,
          cautionMax: 4,
        },
      },
      { text: ' with slightly lower ', tone: 'body' },
      {
        text: 'SpO₂',
        metric: {
          value: 96,
          min: 90,
          max: 100,
          unit: '%',
          display: '96%',
          goodMin: 97,
          cautionMin: 95,
        },
      },
      { text: '. Worth acting early before symptoms peak.', tone: 'body' },
    ],
    category: 'immunity',
    severity: 'medium',
    cause: {
      headline: 'Immune system activation pattern',
      detail:
        'A +6 bpm resting HR with mild SpO₂ dip often appears 24–48 hours before you feel sick—especially after sleep debt.',
      signals: ['Resting HR: +6 bpm', 'SpO₂: 96% (baseline 98%)', 'Sleep debt: active'],
    },
    effect: {
      headline: 'Inflammatory response ramping up',
      detail:
        'Your body may be fighting a virus or bacteria. Pushing hard now often extends illness duration.',
      bodySignals: ['Fatigue without clear cause', 'Mild throat or headache possible', 'Temperature may rise'],
    },
    actions: [
      {
        id: 'c1',
        title: 'Prioritize rest over workouts',
        description: 'Swap intense training for sleep and light movement for 2–3 days.',
        duration: '2–3 days',
        priority: 1,
      },
      {
        id: 'c2',
        title: 'Warm fluids + zinc-rich foods',
        description: 'Broth, citrus, pumpkin seeds. Stay hydrated; avoid alcohol which disrupts sleep.',
        duration: 'Daily',
        priority: 2,
      },
      {
        id: 'c3',
        title: 'Check temperature tonight',
        description: 'Log if above 99.5°F (37.5°C). Retest HRV and HR tomorrow morning.',
        duration: 'Tonight',
        priority: 3,
      },
    ],
    connectedMetrics: ['Resting HR', 'SpO₂', 'Sleep', 'Temperature'],
    confidence: 72,
    detectedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'stress-elevated-1',
    title: 'Stress load is elevated',
    summary:
      'Evening heart rate is above your baseline. Respiratory rate suggests your nervous system has not fully downshifted.',
    summaryHighlights: [
      { text: 'Evening heart rate is ', tone: 'body' },
      {
        text: '+8%',
        metric: {
          value: 8,
          min: 0,
          max: 20,
          unit: '%',
          display: '+8%',
          lowerIsBetter: true,
          goodMax: 3,
          cautionMax: 7,
        },
      },
      {
        text: ' above your baseline. Respiratory rate suggests your nervous system has not fully downshifted.',
        tone: 'body',
      },
    ],
    category: 'stress',
    severity: 'low',
    cause: {
      headline: 'Sustained mental load',
      detail: 'Calendar shows long work blocks; evening HR stayed 8% above baseline three nights in a row.',
      signals: ['Evening HR: +8%', 'Respiratory rate: +1.2/min', 'Screen time after 10 PM'],
    },
    effect: {
      headline: 'Sleep onset and digestion suffer',
      detail: 'Chronic low-grade stress keeps cortisol higher at night, delaying deep sleep and gut comfort.',
      bodySignals: ['Racing thoughts at bed', 'Appetite changes', 'Tension headaches'],
    },
    actions: [
      {
        id: 'd1',
        title: '5-minute box breathing',
        description: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat before lunch and before bed.',
        duration: '2× daily',
        priority: 1,
      },
      {
        id: 'd2',
        title: 'Micro-break every 90 minutes',
        description: 'Stand, walk, or look outside. Breaks reduce cumulative sympathetic load.',
        duration: 'Workdays',
        priority: 2,
      },
    ],
    connectedMetrics: ['Heart rate', 'Respiratory rate', 'Sleep onset'],
    confidence: 81,
    detectedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const bodyStatus = {
  score: 68,
  label: 'Needs attention',
  trend: 'declining' as const,
  message: 'Sleep debt and recovery lag are your top drivers today. Acting on sleep tonight has the highest impact.',
};
