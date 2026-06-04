import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ArrowRight, Brain, CheckCircle, Flame, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { Text } from '@/components/Themed';

import { palette, radii, spacing, typography, cardShadow } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';

type Props = {
  currentWeekNumber: number;
};

export default function WeeklyReviewCard({ currentWeekNumber }: Props) {
  const {
    personalPlan,
    planCheckInLog,
    adaptCurrentWeek,
    planLoading,
    planError,
  } = useHealth();

  const [adapting, setAdapting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // 1. Calculate Previous Phase's Performance
  const prevWeekNumber = currentWeekNumber - 1;
  const prevPhaseIndex = currentWeekNumber - 2;
  const completedPhase = personalPlan?.phases?.[prevPhaseIndex];
  const prevPhaseDuration = completedPhase?.durationDays ?? 7;
  const nextPhase = personalPlan?.phases?.[currentWeekNumber - 1];
  
  const analytics = useMemo(() => {
    const entries = Object.values(planCheckInLog || {}).filter(
      (entry) => entry.weekNumber === prevWeekNumber
    );

    let totalDays = entries.length;
    let effortSum = 0;
    let effortCount = 0;

    entries.forEach((entry) => {
      const answers = entry.answers;
      Object.entries(answers).forEach(([qId, val]) => {
        if (qId.includes('effort')) {
          if (typeof val === 'number') {
            effortSum += val;
            effortCount++;
          }
        }
      });
    });

    const consistencyPercent = Math.min(100, Math.round((totalDays / prevPhaseDuration) * 100));
    const avgEffort = effortCount > 0 ? Number((effortSum / effortCount).toFixed(1)) : null;
    const skippedDays = Math.max(0, prevPhaseDuration - totalDays);

    return {
      totalDays,
      consistencyPercent,
      avgEffort,
      skippedDays,
    };
  }, [planCheckInLog, prevWeekNumber, prevPhaseDuration]);

  // 2. Identify Triggered Adaptation Rules
  const triggeredRules = useMemo(() => {
    const rules = personalPlan?.adaptationRules || [];
    
    return rules.map((rule) => {
      let isTriggered = false;
      let reason = '';

      if (rule.condition === 'avg_above' && analytics.avgEffort !== null) {
        if (analytics.avgEffort > rule.threshold) {
          isTriggered = true;
          reason = `Average effort rating was ${analytics.avgEffort}/5 (threshold: >${rule.threshold})`;
        }
      } else if (rule.condition === 'avg_below' && analytics.avgEffort !== null) {
        if (analytics.avgEffort < rule.threshold) {
          isTriggered = true;
          reason = `Average effort rating was ${analytics.avgEffort}/5 (threshold: <${rule.threshold})`;
        }
      } else if (rule.condition === 'skipped_days_gte') {
        if (analytics.skippedDays >= rule.threshold) {
          isTriggered = true;
          reason = `You skipped ${analytics.skippedDays} days of logging (threshold: >=${rule.threshold} days)`;
        }
      } else if (rule.condition === 'completion_below') {
        const completionRate = Math.round((analytics.totalDays / prevPhaseDuration) * 100);
        if (completionRate < rule.threshold) {
          isTriggered = true;
          reason = `Completion rate was ${completionRate}% (threshold: <${rule.threshold}%)`;
        }
      }

      return {
        ...rule,
        isTriggered,
        reason,
      };
    });
  }, [personalPlan?.adaptationRules, analytics, prevPhaseDuration]);

  const hasTriggeredRules = triggeredRules.some((r) => r.isTriggered);

  // 3. Trigger Adaptation Flow with Micro-animations
  const handleAdapt = async () => {
    if (adapting || !adaptCurrentWeek) return;
    setAdapting(true);
    
    // Aesthetic simulated AI progress steps
    const timer1 = setTimeout(() => setLoadingStep(1), 800);
    const timer2 = setTimeout(() => setLoadingStep(2), 1700);
    
    try {
      await adaptCurrentWeek(currentWeekNumber);
    } catch {
      // Handled by context state
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setAdapting(false);
      setLoadingStep(0);
    }
  };

  if (personalPlan == null) return null;

  return (
    <View style={styles.card}>
      {/* Loading Overlay */}
      {(adapting || planLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={palette.teal} />
          <Text style={styles.loadingTitle}>Adapting Your Plan</Text>
          <Text style={styles.loadingSubtitle}>
            {loadingStep === 0
              ? 'Analyzing previous phase consistency trends...'
              : loadingStep === 1
                ? 'Processing behavioral adjustment guidelines...'
                : 'Tailoring customized checklist and daily targets...'}
          </Text>
        </View>
      )}

      {/* Header section */}
      <View style={styles.header}>
        <View style={styles.sparkleBg}>
          <Sparkles size={22} color={palette.teal} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{completedPhase?.title || `Phase ${prevWeekNumber} Complete!`}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Unlock and adapt: {nextPhase?.title || `Phase ${currentWeekNumber}`}
          </Text>
        </View>
      </View>

      {/* Analytics stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>
          {completedPhase?.title || `Phase ${prevWeekNumber}`} Analytics
        </Text>
        
        <View style={styles.statsGrid}>
          {/* Consistency */}
          <View style={styles.statCard}>
            <View style={styles.statIconHeader}>
              <CheckCircle size={16} color={palette.teal} />
              <Text style={styles.statLabel}>Consistency</Text>
            </View>
            <Text style={styles.statValue}>{analytics.consistencyPercent}%</Text>
            <Text style={styles.statSubText}>{analytics.totalDays} of {prevPhaseDuration} days logged</Text>
          </View>

          {/* Effort Resistance */}
          <View style={styles.statCard}>
            <View style={styles.statIconHeader}>
              <Brain size={16} color={palette.coral} />
              <Text style={styles.statLabel}>Resistance</Text>
            </View>
            <Text style={styles.statValue}>
              {analytics.avgEffort !== null ? `${analytics.avgEffort}/5` : 'N/A'}
            </Text>
            <Text style={styles.statSubText}>Avg effort score</Text>
          </View>
        </View>
      </View>

      {/* Triggered rules section */}
      <View style={styles.rulesSection}>
        <Text style={styles.sectionTitle}>Behavior & Adjustment Rules</Text>
        
        {hasTriggeredRules ? (
          <View style={styles.rulesList}>
            {triggeredRules
              .filter((r) => r.isTriggered)
              .map((rule, idx) => (
                <View key={idx} style={styles.ruleItem}>
                  <View style={styles.ruleHeaderRow}>
                    <View style={styles.ruleAlertBadge}>
                      <AlertTriangle size={12} color="#D97706" style={{ marginRight: 4 }} />
                      <Text style={styles.ruleAlertText}>TRIGGERED</Text>
                    </View>
                    <Text style={styles.ruleReason}>{rule.reason}</Text>
                  </View>
                  <View style={styles.ruleBody}>
                    <Text style={styles.ruleHeading}>Adaptation Action:</Text>
                    <Text style={styles.ruleInstruction}>{rule.instruction}</Text>
                  </View>
                </View>
              ))}
          </View>
        ) : (
          <View style={styles.successRuleRow}>
            <Flame size={18} color="#16A34A" />
            <Text style={styles.successRuleText}>
              Perfect routine momentum! Your micro-actions had low friction, so the next phase will steadily transition you into active lifestyle improvements.
            </Text>
          </View>
        )}
      </View>

      {/* Plan Preview Section */}
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>
          {nextPhase?.title || `Provisional Phase ${currentWeekNumber} Focus`}
        </Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewFocus}>
            {nextPhase?.title || `Dynamic action steps`}
          </Text>
          <Text style={styles.previewBody}>
            {nextPhase?.dailyUserWork || 
              `Your customized target steps will be generated instantly using behavioral analysis and personalized logic based on your check-in logs.`}
          </Text>
        </View>
      </View>

      {/* Plan Error block */}
      {planError && <Text style={styles.errorText}>{planError}</Text>}

      {/* Adapt Action Button */}
      <Pressable 
        style={({ pressed }) => [
          styles.adaptButton,
          pressed && styles.adaptButtonPressed
        ]}
        onPress={handleAdapt}
      >
        <Text style={styles.adaptButtonText}>
          Adapt Plan
        </Text>
        <ArrowRight size={16} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    gap: spacing.xl,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    ...cardShadow,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  loadingTitle: {
    fontSize: typography.subtitle + 2,
    fontWeight: '800',
    color: palette.slate,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: typography.body,
    color: palette.slateSubtle,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg - 2,
  },
  headerText: {
    flex: 1,
  },
  sparkleBg: {
    width: 44,
    height: 44,
    borderRadius: radii.lg - 2,
    backgroundColor: palette.sageLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: palette.slate,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.body - 1,
    color: palette.slateSubtle,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.body - 1,
    fontWeight: '700',
    color: palette.slateSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  statsSection: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.background,
    borderRadius: radii.lg - 2,
    padding: spacing.lg - 2,
    gap: 4,
  },
  statIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.caption + 1,
    fontWeight: '600',
    color: palette.slateMuted,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.slate,
  },
  statSubText: {
    fontSize: typography.caption + 1,
    color: palette.slateSubtle,
  },
  rulesSection: {
    width: '100%',
  },
  rulesList: {
    gap: spacing.sm + 2,
  },
  ruleItem: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: radii.lg - 2,
    padding: spacing.lg - 2,
    gap: spacing.sm,
  },
  ruleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  ruleAlertBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.sm - 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleAlertText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  ruleReason: {
    fontSize: typography.body - 2,
    fontWeight: '500',
    color: palette.slateMuted,
    flex: 1,
  },
  ruleBody: {
    gap: 2,
  },
  ruleHeading: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: palette.slateSubtle,
    textTransform: 'uppercase',
  },
  ruleInstruction: {
    fontSize: typography.body - 1,
    lineHeight: 18,
    color: palette.slate,
    fontWeight: '600',
  },
  successRuleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3FAF8',
    borderRadius: radii.lg - 2,
    padding: spacing.lg - 2,
    gap: spacing.sm + 2,
  },
  successRuleText: {
    flex: 1,
    fontSize: typography.body - 1,
    lineHeight: 18,
    color: palette.slateMuted,
  },
  previewSection: {
    width: '100%',
  },
  previewBox: {
    backgroundColor: palette.background,
    borderRadius: radii.lg - 2,
    padding: spacing.lg - 2,
    gap: 6,
  },
  previewFocus: {
    fontSize: typography.body,
    fontWeight: '700',
    color: palette.slate,
  },
  previewBody: {
    fontSize: typography.body - 1,
    lineHeight: 18,
    color: palette.slateSubtle,
  },
  adaptButton: {
    backgroundColor: palette.teal,
    borderRadius: radii.lg - 2,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    marginTop: 6,
  },
  adaptButtonPressed: {
    opacity: 0.9,
  },
  adaptButtonText: {
    color: '#fff',
    fontSize: typography.body + 1,
    fontWeight: '700',
  },
  errorText: {
    color: palette.high,
    fontSize: typography.body - 1,
    textAlign: 'center',
  },
});
