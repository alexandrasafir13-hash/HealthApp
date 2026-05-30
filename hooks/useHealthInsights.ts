import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildHealthInsightsContext,
  fingerprintHealthInsightsContext,
} from '@/lib/buildHealthInsightsContext';
import { recentRoutineDaysFromLog } from '@/lib/routineCompletionHistory';
import { fetchHealthInsights } from '@/lib/fetchHealthInsights';
import { isHealthInsightsConfigured } from '@/lib/healthInsightsConfig';
import { loadHealthInsightsCache, saveHealthInsightsCache } from '@/lib/healthInsightsCache';
import { loadTestResults } from '@/lib/testResultsStorage';
import { RoutineCompletionLog } from '@/lib/routineCompletionStorage';
import { HealthLlmInsight } from '@/types/healthInsights';
import { UserProfile } from '@/types/onboarding';
import { PersonalRoutine } from '@/types/routine';
import { TodayRoutineStep } from '@/context/HealthContext';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface Input {
  profile: UserProfile | null;
  personalRoutine: PersonalRoutine | null;
  todayRoutineSteps: TodayRoutineStep[];
  routineCompletionLog: RoutineCompletionLog;
  enabled: boolean;
}

function isValidInsight(insight: HealthLlmInsight | null | undefined): insight is HealthLlmInsight {
  return (
    insight != null &&
    Array.isArray(insight.insights) &&
    insight.insights.length > 0 &&
    Array.isArray(insight.recommendations) &&
    insight.recommendations.length > 0 &&
    Array.isArray(insight.questions) &&
    insight.questions.length > 0
  );
}

export function useHealthInsights(input: Input) {
  const configured = isHealthInsightsConfigured();
  const [insight, setInsight] = useState<HealthLlmInsight | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Awaited<ReturnType<typeof loadTestResults>>>([]);
  const requestId = useRef(0);

  useEffect(() => {
    let mounted = true;
    void loadTestResults().then((docs) => {
      if (mounted) setUploadedDocuments(docs);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const recentRoutineDays = useMemo(
    () => recentRoutineDaysFromLog(input.routineCompletionLog, input.personalRoutine, 14),
    [input.routineCompletionLog, input.personalRoutine],
  );

  const context = useMemo(() => {
    if (!input.profile) return null;
    return buildHealthInsightsContext({
      profile: input.profile,
      personalRoutine: input.personalRoutine,
      todayRoutineSteps: input.todayRoutineSteps,
      uploadedDocuments,
      recentRoutineDays,
    });
  }, [
    input.profile,
    input.personalRoutine,
    input.todayRoutineSteps,
    uploadedDocuments,
    recentRoutineDays,
  ]);

  const fingerprint = useMemo(
    () => (context ? fingerprintHealthInsightsContext(context) : null),
    [context],
  );

  const load = useCallback(
    async (force: boolean) => {
      if (!configured || !context || !fingerprint || !input.enabled) return;

      if (!force) {
        const cached = await loadHealthInsightsCache();
        if (cached?.fingerprint === fingerprint && isValidInsight(cached.insight)) {
          setInsight(cached.insight);
          setStatus('ready');
          setError(null);
          return;
        }
      }

      const id = ++requestId.current;
      setStatus('loading');
      setError(null);

      try {
        const result = await fetchHealthInsights(context);
        if (id !== requestId.current) return;
        setInsight(result);
        setStatus('ready');
        await saveHealthInsightsCache({
          fingerprint,
          insight: result,
          fetchedAt: new Date().toISOString(),
        });
      } catch (e) {
        if (id !== requestId.current) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Could not load insights');
      }
    },
    [configured, context, fingerprint, input.enabled],
  );

  useEffect(() => {
    if (!input.enabled || !configured || !fingerprint) {
      setInsight(null);
      setStatus('idle');
      setError(null);
      return;
    }
    void load(false);
  }, [input.enabled, configured, fingerprint, load]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  return {
    configured,
    insight,
    status,
    error,
    refresh,
    isLoading: status === 'loading',
  };
}
