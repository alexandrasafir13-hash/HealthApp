import { BodyInsight, DailyCheckIn, InsightSeverity } from '@/types/health';

function bumpSeverity(current: InsightSeverity, target: InsightSeverity): InsightSeverity {
  const rank: Record<InsightSeverity, number> = { low: 1, medium: 2, high: 3 };
  return rank[target] > rank[current] ? target : current;
}

export function hasReportedSymptoms(checkIn: DailyCheckIn): boolean {
  return checkIn.symptoms.some((s) => s !== 'None');
}

function hasSymptoms(checkIn: DailyCheckIn): boolean {
  return hasReportedSymptoms(checkIn);
}

export function applyCheckInToInsights(
  base: BodyInsight[],
  checkIn: DailyCheckIn | null,
): BodyInsight[] {
  if (!checkIn) return base;

  return base.map((insight) => {
    let severity = insight.severity;

    switch (insight.category) {
      case 'sleep':
        if (checkIn.sleepQuality <= 2) severity = bumpSeverity(severity, 'high');
        else if (checkIn.sleepQuality === 3) severity = bumpSeverity(severity, 'medium');
        break;
      case 'recovery':
        if (checkIn.energy <= 2) severity = bumpSeverity(severity, 'high');
        else if (checkIn.energy === 3) severity = bumpSeverity(severity, 'medium');
        break;
      case 'stress':
        if (checkIn.stress >= 5) severity = bumpSeverity(severity, 'high');
        else if (checkIn.stress >= 4) severity = bumpSeverity(severity, 'medium');
        break;
      case 'immunity':
        if (hasSymptoms(checkIn)) {
          severity = bumpSeverity(
            severity,
            checkIn.symptoms.filter((s) => s !== 'None').length >= 2 ? 'high' : 'medium',
          );
        }
        break;
      default:
        break;
    }

    if (severity === insight.severity) return insight;
    return { ...insight, severity };
  });
}

export function formatRoutineMetricsSummary(checkIn: DailyCheckIn): string {
  const energyLabel = ['Very low', 'Low', 'OK', 'Good', 'High'][checkIn.energy - 1];
  const sleepLabel = ['Poor', 'Fair', 'OK', 'Good', 'Great'][checkIn.sleepQuality - 1];
  const stressLabel = ['Calm', 'Mild', 'Moderate', 'High', 'Very high'][checkIn.stress - 1];
  return `Energy ${energyLabel.toLowerCase()} · Sleep ${sleepLabel.toLowerCase()} · Stress ${stressLabel.toLowerCase()}`;
}

export function formatSymptomsSummary(checkIn: DailyCheckIn): string {
  const symptomText = hasReportedSymptoms(checkIn)
    ? checkIn.symptoms.filter((s) => s !== 'None').join(', ')
    : 'None';
  return `Symptoms: ${symptomText}`;
}

export function formatCheckInSummary(checkIn: DailyCheckIn): string {
  return `${formatRoutineMetricsSummary(checkIn)} · ${formatSymptomsSummary(checkIn)}`;
}
