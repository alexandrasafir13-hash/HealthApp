import { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Calendar, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';

import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { getSimulatedDate } from '@/lib/localDate';
import { palette, typography, cardShadow } from '@/constants/theme';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';

export default function SandboxScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
    const [confirmReset, setConfirmReset] = useState(false);

  const {
    simulatedOffsetDays,
    changeSimulatedOffsetDays,
    personalPlan,
    updateActiveWeekNumber,
    profile,
    planCheckInLog,
    resetAllData,
  } = useHealth();

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await resetAllData();
    router.replace('/');
  };

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={pageStyle}>
        <PageTitle title={`Sandbox`} />
        <Text style={styles.lead}>
          {`Simulate dates, plan phases and inspect diagnostic telemetry to test app behavior.`}
        </Text>

        <View style={styles.sectionCard}>
          {/* 1. Time Travel Date Controls */}
          <View style={styles.sandboxSection}>
            <Text style={styles.sandboxSectionTitle}>{`SIMULATED CURRENT DATE`}</Text>
            
            <View style={styles.dateDisplayContainer}>
              <Calendar size={16} color={palette.slateMuted} />
              <View style={styles.dateDisplayTexts}>
                <Text style={styles.dateDisplayValue}>
                  {getSimulatedDate().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.dateDisplayOffset}>
                  {simulatedOffsetDays === 0
                    ? `Synced with system time`
                    : `Advanced by +${simulatedOffsetDays} days vs real time`}
                </Text>
              </View>
            </View>

            <View style={styles.sandboxActionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.sandboxActionButton,
                  pressed && styles.sandboxActionButtonPressed,
                ]}
                onPress={() => changeSimulatedOffsetDays(simulatedOffsetDays + 1)}>
                <Text style={styles.sandboxActionButtonText}>+1 {`day`}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.sandboxActionButton,
                  pressed && styles.sandboxActionButtonPressed,
                ]}
                onPress={() => changeSimulatedOffsetDays(simulatedOffsetDays + 7)}>
                <Text style={styles.sandboxActionButtonText}>+7 {`days`}</Text>
              </Pressable>

              {simulatedOffsetDays !== 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.sandboxActionButtonReset,
                    pressed && styles.sandboxActionButtonPressed,
                  ]}
                  onPress={() => changeSimulatedOffsetDays(0)}>
                  <RefreshCw size={11} color="#D97706" style={styles.resetIcon} />
                  <Text style={styles.sandboxActionButtonTextReset}>{`Reset to today`}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* 2. Active Plan Phase Swapper */}
        <View style={styles.sectionCard}>
          {personalPlan ? (
            <View style={styles.sandboxSection}>
              <Text style={styles.sandboxSectionTitle}>{`ACTIVE PLAN PHASE`}</Text>
              <Text style={styles.sandboxSectionDesc}>
                {`Force active plan display and daily routine for a specific phase.`}
              </Text>
              <View style={styles.sandboxWeekRow}>
                {(personalPlan.phases || []).map((phase: any, idx: number) => {
                  const phaseNumber = idx + 1;
                  const isActive = personalPlan.activeWeekNumber === phaseNumber;
                  return (
                    <Pressable
                      key={phase.id || `phase-${phaseNumber}`}
                      style={[
                        styles.sandboxWeekChip,
                        isActive && styles.sandboxWeekChipActive,
                      ]}
                      onPress={() => updateActiveWeekNumber(phaseNumber)}>
                      <Text
                        style={[
                          styles.sandboxWeekChipLabel,
                          isActive && styles.sandboxWeekChipLabelActive,
                        ]}>
                        {`Phase`} {phaseNumber}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.sandboxSection}>
              <Text style={styles.sandboxSectionTitle}>{`ACTIVE PLAN PHASE`}</Text>
              <Text style={styles.sandboxSectionDescDisabled}>
                {`Complete onboarding or generate a plan to simulate phases.`}
              </Text>
            </View>
          )}
        </View>

        {/* 3. Diagnostic Data */}
        <View style={styles.sectionCard}>
          <View style={styles.sandboxSection}>
            <Text style={styles.sandboxSectionTitle}>{`DIAGNOSTIC TELEMETRY`}</Text>
            <View style={styles.diagnosticsGrid}>
              <View style={styles.diagnosticItem}>
                <Text style={styles.diagnosticLabel}>{`Date key`}</Text>
                <Text style={styles.diagnosticValue}>{getSimulatedDate().toISOString().split('T')[0]}</Text>
              </View>
              <View style={styles.diagnosticItem}>
                <Text style={styles.diagnosticLabel}>{`Profile configured`}</Text>
                <Text style={styles.diagnosticValue}>{profile ? `Yes` : `No`}</Text>
              </View>
              <View style={styles.diagnosticItem}>
                <Text style={styles.diagnosticLabel}>{`Active habit ID`}</Text>
                <Text style={styles.diagnosticValue} numberOfLines={1} ellipsizeMode="tail">
                  {personalPlan?.goalId || `None`}
                </Text>
              </View>
              <View style={styles.diagnosticItem}>
                <Text style={styles.diagnosticLabel}>{`Logged check-ins`}</Text>
                <Text style={styles.diagnosticValue}>{Object.keys(planCheckInLog || {}).length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Danger Zone (Destructive Actions) */}
        <View style={[styles.sectionCard, { borderColor: 'rgba(196, 92, 74, 0.2)', borderWidth: 1 }]}>
          <View style={styles.sandboxSection}>
            <Text style={[styles.sandboxSectionTitle, { color: palette.high }]}>{`DANGER ZONE`}</Text>
            <Text style={styles.sandboxSectionDesc}>
              {`Delete all profile info, daily logs and personalized plans. This will permanently reset the app state.`}
            </Text>
            <Pressable
              style={[styles.resetButton, confirmReset && styles.resetButtonConfirm]}
              onPress={handleReset}
              accessibilityRole="button">
              <Text style={[styles.resetButtonText, confirmReset && styles.resetButtonTextConfirm]}>
                {confirmReset ? `Tap again to confirm hard reset` : `Reset profile and restart onboarding`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: typography.body,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...cardShadow,
  },
  sandboxSection: {
    width: '100%',
  },
  sandboxSectionTitle: {
    fontSize: typography.caption + 1,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sandboxSectionDesc: {
    fontSize: typography.body - 1,
    color: palette.slateSubtle,
    lineHeight: 16,
    marginBottom: 12,
  },
  sandboxSectionDescDisabled: {
    fontSize: typography.body - 1,
    color: palette.slateSubtle,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  dateDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dateDisplayTexts: {
    flex: 1,
    gap: 1,
  },
  dateDisplayValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: palette.slate,
  },
  dateDisplayOffset: {
    fontSize: typography.body - 2,
    color: palette.slateMuted,
  },
  sandboxActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sandboxActionButton: {
    flex: 1,
    minWidth: 70,
    backgroundColor: palette.background,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sandboxActionButtonReset: {
    flex: 1.2,
    minWidth: 110,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  resetIcon: {
    marginRight: -2,
  },
  sandboxActionButtonText: {
    fontSize: typography.body - 1,
    fontWeight: '600',
    color: palette.slate,
  },
  sandboxActionButtonTextReset: {
    fontSize: typography.body - 1,
    fontWeight: '700',
    color: '#D97706',
  },
  sandboxActionButtonPressed: {
    opacity: 0.7,
  },
  sandboxWeekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sandboxWeekChip: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: palette.background,
    alignItems: 'center',
  },
  sandboxWeekChipActive: {
    backgroundColor: palette.sageLight,
  },
  sandboxWeekChipLabel: {
    fontSize: typography.body - 1,
    color: palette.slateMuted,
    fontWeight: '500',
  },
  sandboxWeekChipLabelActive: {
    color: palette.tealDark,
    fontWeight: '700',
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  diagnosticItem: {
    width: '45%',
    flexGrow: 1,
    backgroundColor: palette.background,
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  diagnosticLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: palette.slateSubtle,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  diagnosticValue: {
    fontSize: typography.body - 1,
    fontWeight: '600',
    color: palette.slate,
  },
  resetButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(196, 92, 74, 0.05)',
    marginTop: 8,
  },
  resetButtonConfirm: {
    backgroundColor: palette.high,
  },
  resetButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: palette.high,
  },
  resetButtonTextConfirm: {
    color: '#fff',
    fontWeight: '700',
  },
});
