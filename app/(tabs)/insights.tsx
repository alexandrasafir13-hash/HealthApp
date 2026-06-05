import { AlertTriangle, CheckCircle2, Compass, Quote } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';
import { habitCatalog } from '@/data/onboardingOptions';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';

export default function InsightsScreen() {
  const { profile, planCheckInLog, personalPlan } = useHealth();
  const { contentContainerStyle, pageStyle } = usePageLayout();
  
  const data = useInsightsData(profile, planCheckInLog, personalPlan);

  const activeConcerns = (profile?.physicalConcernIds ?? [])
    .filter((id: string) => id.length > 0)
    .map((id: string) => id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle} showsVerticalScrollIndicator={false}>
      <View style={pageStyle}>
        <PageTitle title={`Your Narrative`} subtitle={`A coherent view over your context, focus and progress.`} />

        <Animated.View entering={FadeInDown.duration(250).delay(50)} style={styles.contentWrapper}>
          
          {/* Section 1: The Synthesis (Story) */}
          {profile?.onboardingUserStory?.fullStory && (
            <View style={styles.storySection}>
              <Quote size={32} color={palette.teal} style={styles.quoteIcon} />
              <Text style={styles.storyText}>{profile.onboardingUserStory.fullStory}</Text>
            </View>
          )}

          {/* Section 2: The Focus (Concerns + Goals woven together) */}
          <View style={styles.focusSection}>
              <Text style={styles.proseText}>
              {`You started this journey to address `}
              {activeConcerns.length > 0 ? (
                activeConcerns.map((c, i) => (
                  <Text key={i}>
                    <Text style={styles.highlightAmber}>{c}</Text>
                    {i < activeConcerns.length - 2 ? ', ' : i === activeConcerns.length - 2 ? ` ${`and`} ` : ''}
                  </Text>
                ))
              ) : (
                <Text style={styles.highlightAmber}>{`your wellbeing`}</Text>
              )}
              . {`To progress, your current focus is `}
              {data.activeHabits.length > 0 ? (
                data.activeHabits.map((h: { id: string; title: string }, i: number) => (
                  <Text key={i}>
                    <Text style={styles.highlightTeal}>{h.title}</Text>
                    {i < data.activeHabits.length - 2 ? ', ' : i === data.activeHabits.length - 2 ? ` ${`and`} ` : ''}
                  </Text>
                ))
              ) : (
                <Text style={styles.highlightTeal}>{`building a healthy routine`}</Text>
              )}.
            </Text>
          </View>

          {/* Section 3: Plan Insights (What we designed) */}
          {data.planInsights && data.planInsights.length > 0 && (
            <View style={styles.insightsSection}>
              <Text style={styles.sectionHeading}>{`Plan observations`}</Text>
              <View style={styles.insightBlockList}>
                {data.planInsights.map((insight: string, idx: number) => (
                  <View key={idx} style={styles.cleanInsightRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.cleanInsightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Section 4: Behavioral Insights (How it's going) */}
          <View style={styles.insightsSection}>
              <Text style={styles.sectionHeading}>{`Behavioral Insights`}</Text>
            {data.derivedInsights && data.derivedInsights.length > 0 ? (
              <View style={styles.insightBlockList}>
                {data.derivedInsights.map((insight) => (
                  <View key={insight.id} style={styles.cleanInsightRow}>
                    {insight.type === 'success' ? (
                      <CheckCircle2 size={20} color={palette.teal} style={{ marginTop: 2 }} />
                    ) : insight.type === 'warning' ? (
                      <AlertTriangle size={20} color={palette.coral} style={{ marginTop: 2 }} />
                    ) : (
                      <Compass size={20} color={palette.teal} style={{ marginTop: 2 }} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.insightItemTitle}>{insight.title}</Text>
                      <Text style={styles.cleanInsightText}>{insight.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
                <Text style={styles.emptyText}>
                {`Complete the daily check-in on the Today screen to generate insights about your behavior and routine adaptation.`}
              </Text>
            )}
          </View>

        </Animated.View>
      </View>
    </ScrollView>
  );
}

function useInsightsData(profile: any, planCheckInLog: any, personalPlan: any) {

  const activeHabits = useMemo(() => {
    return (profile?.habitIds ?? []).map((id: string) => {
      const h = habitCatalog.find((h) => h.id === id);
      if (h) return { id, title: h.title };
      if (personalPlan && personalPlan.goalId === id) return { id, title: personalPlan.goalName };
      return { id, title: id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') };
    });
  }, [profile?.habitIds, personalPlan]);

  const derivedInsights = useMemo(() => {
    const list: Array<{ id: string; title: string; text: string; type: 'success' | 'warning' | 'info' }> = [];
    const entries = Object.values(planCheckInLog || {});

    if (entries.length === 0) return null;

    const phaseGroups: Record<number, typeof entries> = {};
    entries.forEach((entry: any) => {
      const phaseNum = entry.weekNumber;
      if (!phaseGroups[phaseNum]) phaseGroups[phaseNum] = [];
      phaseGroups[phaseNum].push(entry);
    });

    const currentPhaseNum = personalPlan?.activeWeekNumber ?? 1;
    const currentPhaseEntries = phaseGroups[currentPhaseNum] || [];
    const prevPhaseNum = currentPhaseNum - 1;
    const prevPhaseEntries = phaseGroups[prevPhaseNum] || [];

    const activePhaseObj = personalPlan?.phases?.[currentPhaseNum - 1];
    const durationDays = activePhaseObj?.durationDays ?? 7;
    const currentConsistency = durationDays > 0
      ? Math.round((currentPhaseEntries.length / durationDays) * 100)
      : 0;

    if (prevPhaseNum > 0 && prevPhaseEntries.length > 0) {
      const prevPhaseObj = personalPlan?.phases?.[prevPhaseNum - 1];
      const prevDuration = prevPhaseObj?.durationDays ?? 7;
      const prevConsistency = prevDuration > 0
        ? Math.round((prevPhaseEntries.length / prevDuration) * 100)
        : 0;

      const diff = currentConsistency - prevConsistency;

      let prevEffortSum = 0, prevEffortCount = 0;
      prevPhaseEntries.forEach((entry: any) => {
        Object.entries(entry.answers || {}).forEach(([qId, val]) => {
          if (qId.includes('effort') && typeof val === 'number') {
            prevEffortSum += val;
            prevEffortCount++;
          }
        });
      });
      const prevAvgEffort = prevEffortCount > 0 ? (prevEffortSum / prevEffortCount) : null;

      let currEffortSum = 0, currEffortCount = 0;
      currentPhaseEntries.forEach((entry: any) => {
        Object.entries(entry.answers || {}).forEach(([qId, val]) => {
          if (qId.includes('effort') && typeof val === 'number') {
            currEffortSum += val;
            currEffortCount++;
          }
        });
      });
      const currAvgEffort = currEffortCount > 0 ? (currEffortSum / currEffortCount) : null;

      const adaptedPhaseName = activePhaseObj?.title || `Phase ${currentPhaseNum}`;
      const prevPhaseName = prevPhaseObj?.title || `Phase ${prevPhaseNum}`;

      if (diff > 0) {
        list.push({
          id: 'adaptation-impact-positive',
          title: 'Adapted plan impact',
          text: `After transitioning from "${prevPhaseName}" to "${adaptedPhaseName}", daily completion consistency increased by ${diff}% (from ${prevConsistency}% to ${currentConsistency}%). This shows the adapted goals fit your daily rhythm better.`,
          type: 'success',
        });
      } else if (diff < 0) {
        list.push({
          id: 'adaptation-impact-friction',
          title: 'Verificarea adaptării planului',
          text: `Consecvența completărilor zilnice s-a ajustat de la ${prevConsistency}% în "${prevPhaseName}" la ${currentConsistency}% în faza curentă "${adaptedPhaseName}". Noua fază introduce pași suplimentari care pot crea puțină fricțiune. Simplificarea sau ajustarea reperului de declanșare ar putea ajuta la recâștigarea ritmului.`,
          type: 'info',
        });
      } else {
        list.push({
          id: 'adaptation-impact-stable',
          title: 'Adapted routine stability',
          text: `Your daily consistency stabilized at ${currentConsistency}% after transitioning to "${adaptedPhaseName}". Maintaining this rhythm is a good sign the routine is integrating.`,
          type: 'success',
        });
      }

      if (prevAvgEffort !== null && currAvgEffort !== null) {
        const effortDiff = prevAvgEffort - currAvgEffort;
        if (effortDiff > 0.3) {
          list.push({
            id: 'effort-reduction',
            title: 'Friction reduction',
            text: `After adjusting the routine, the average effort score dropped from ${prevAvgEffort.toFixed(1)}/5 to ${currAvgEffort.toFixed(1)}/5. This ${Math.round((effortDiff / prevAvgEffort) * 100)}% reduction shows the adapted micro-actions are significantly easier to do.`,
            type: 'success',
          });
        }
      }
    } else {
      if (currentConsistency > 75) {
        list.push({
          id: 'first-phase-momentum',
          title: 'Good routine momentum',
          text: `You successfully completed ${currentPhaseEntries.length} out of ${durationDays} days in your first phase, "${activePhaseObj?.title || 'Phase 1'}". The consistency rate is ${currentConsistency}%, which is excellent for building a durable routine.`,
          type: 'success',
        });
      } else if (currentConsistency > 40) {
        list.push({
          id: 'first-phase-building',
          title: 'Integrarea rutinei',
          text: `Ai completat ${currentPhaseEntries.length} zile în "${activePhaseObj?.title || 'Faza 1'}". Consecvența ta de ${currentConsistency}% arată un progres constant. Ca să reduci fricțiunea, încearcă un reminder fizic sau vizual în traseul tău zilnic.`,
          type: 'info',
        });
      } else {
        list.push({
          id: 'first-phase-friction',
          title: 'Simplification window',
          text: `Initial completion consistency is ${currentConsistency}%. If the current routine is hard to remember or execute, you can use the analysis at the end of this phase to simplify actions or change daily triggers.`,
          type: 'info',
        });
      }
    }

    let highEnergyEffortSum = 0;
    let highEnergyEffortCount = 0;
    let lowEnergyEffortSum = 0;
    let lowEnergyEffortCount = 0;

    entries.forEach((entry: any) => {
      const answers = entry.answers || {};
      let energyVal = answers['energy'] ?? answers['observe-energy'];
      let effortVal = answers['observe-effort'] ?? answers['effort'];

      const energyNum = typeof energyVal === 'number' ? energyVal : (typeof energyVal === 'string' ? parseInt(energyVal, 10) : null);
      const effortNum = typeof effortVal === 'number' ? effortVal : (typeof effortVal === 'string' ? parseInt(effortVal, 10) : null);

      if (energyNum !== null && Number.isFinite(energyNum)) {
        if (energyNum >= 4) {
          if (effortNum !== null && Number.isFinite(effortNum)) {
            highEnergyEffortSum += effortNum;
            highEnergyEffortCount++;
          }
        } else if (energyNum <= 2) {
          if (effortNum !== null && Number.isFinite(effortNum)) {
            lowEnergyEffortSum += effortNum;
            lowEnergyEffortCount++;
          }
        }
      }
    });

    if (highEnergyEffortCount > 0 && lowEnergyEffortCount > 0) {
      const highEnergyAvgEffort = highEnergyEffortSum / highEnergyEffortCount;
      const lowEnergyAvgEffort = lowEnergyEffortSum / lowEnergyEffortCount;
      const difference = lowEnergyAvgEffort - highEnergyAvgEffort;

      if (difference > 0.5) {
        list.push({
          id: 'energy-friction-correlation',
          title: 'Energy & Friction connection',
          text: `On low energy days, resistance to the routine increases to ${lowEnergyAvgEffort.toFixed(1)}/5, compared to only ${highEnergyAvgEffort.toFixed(1)}/5 on high energy days. This shows the routine is highly sensitive to fatigue. Focus on recovery triggers and consider a shorter fallback routine when tired.`,
          type: 'info',
        });
      }
    }

    const timeBuckets: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    let loggedTimesCount = 0;

    entries.forEach((entry: any) => {
      Object.entries(entry.answers || {}).forEach(([qId, val]) => {
        if ((qId.includes('pattern-time') || qId.includes('first-scroll') || qId.includes('time')) && typeof val === 'string' && val.includes(':')) {
          const hr = parseInt(val.split(':')[0], 10);
          if (!Number.isNaN(hr)) {
            loggedTimesCount++;
            if (hr >= 5 && hr < 12) timeBuckets.Morning++;
            else if (hr >= 12 && hr < 17) timeBuckets.Afternoon++;
            else if (hr >= 17 && hr < 21) timeBuckets.Evening++;
            else timeBuckets.Night++;
          }
        }
      });
    });

    let peakBucket: string | null = null;
    let maxCount = 0;
    Object.entries(timeBuckets).forEach(([b, c]) => { if (c > maxCount) { maxCount = c; peakBucket = b; } });

    if (peakBucket && maxCount > 1) {
      const pct = Math.round((maxCount / loggedTimesCount) * 100);
      list.push({
        id: 'peak-completion-window',
          title: 'Optimal routine window',
          text: `You execute your routine in the ${peakBucket} in ${pct}% of cases. This shows that the ${peakBucket} hours provide the strongest environmental and mental triggers for consistency.`,
        type: 'info',
      });
    }

    return list;
  }, [planCheckInLog, personalPlan]);

  const planInsights = useMemo(() => {
    return personalPlan?.insights || [];
  }, [personalPlan]);

  return {
    activeHabits,
    derivedInsights,
    planInsights,
  };
}

const styles = StyleSheet.create({
  contentWrapper: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 48,
  },
  storySection: {
    marginBottom: 8,
  },
  quoteIcon: {
    marginBottom: 16,
    opacity: 0.2,
  },
  storyText: {
    fontSize: 22,
    lineHeight: 34,
    fontWeight: '600',
    color: palette.slate,
    letterSpacing: -0.5,
  },
  focusSection: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: palette.tealDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  proseText: {
    fontSize: 18,
    lineHeight: 32,
    color: palette.slateMuted,
    fontWeight: '500',
  },
  highlightAmber: {
    color: '#B45309',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
  },
  highlightTeal: {
    color: palette.tealDark,
    fontWeight: '700',
    backgroundColor: '#CCFBF1',
  },
  insightsSection: {
    gap: 20,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.slate,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  insightBlockList: {
    gap: 24,
  },
  cleanInsightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.teal,
    marginTop: 10,
  },
  insightItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cleanInsightText: {
    fontSize: 16,
    lineHeight: 26,
    color: palette.slateMuted,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 24,
    color: palette.slateMuted,
    fontStyle: 'italic',
  },
});
