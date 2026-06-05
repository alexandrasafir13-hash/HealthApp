import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '@/components/Themed';
import { usePageLayout } from '@/hooks/usePageLayout';

import { palette, radii, spacing, typography, cardShadow } from '@/constants/theme';
import { AdaptivePlan, PlanPhase, planDisplayTitle } from '@/types/plan';
import { shortDuration } from '@/lib/formatText';

type Props = {
  plan: AdaptivePlan;
  activeWeekNumber?: number;
  showIntro?: boolean;
};

export default function ActivePlanCard({
  plan,
  activeWeekNumber = 1,
  showIntro = true,
}: Props) {
  usePageLayout();
  const phases = plan.phases ?? [];
  const [selectedPhase, setSelectedPhase] = useState<{ phase: PlanPhase; index: number } | null>(null);
  const [tooltipMessage, setTooltipMessage] = useState<string | null>(null);
  
  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardScrollContent}>
          {showIntro && (
            <View style={styles.introSection}>
              <Text style={styles.heading}>{planDisplayTitle(plan)}</Text>
              <Text style={styles.summary}>{plan.goalSummary}</Text>
              {plan.reasoningSummary ? (
                <Text style={{ fontSize: 13, color: palette.slateSubtle, marginTop: 4, fontStyle: 'italic' }}>
                  {`Why this path:`} {plan.reasoningSummary}
                </Text>
              ) : null}
            </View>
          )}

          <View style={styles.weekList}>
            {phases.map((phase, index) => {
              const isActive = index + 1 === activeWeekNumber;
              const isFuture = index + 1 > activeWeekNumber;
              const isLast = index === phases.length - 1;
              return (
                <View key={phase.id} style={styles.weekRow}>
                  {/* Left Timeline Column */}
                  <View style={styles.timelineColumn}>
                    {!isLast && <View style={styles.dottedLine} />}
                    <View style={[styles.bullet, isActive && styles.bulletActive]}>
                      {isActive && <View style={styles.bulletInner} />}
                    </View>
                  </View>

                  {/* Right Content */}
                  <Pressable
                    style={[
                      styles.weekBlock,
                      isActive ? styles.weekBlockActive : styles.weekBlockInactive,
                    ]}
                    onPress={isFuture ? () => {
                      const remaining = phases
                        .slice(activeWeekNumber - 1, index)
                        .reduce((sum, p) => sum + p.durationDays, 0);
                      setTooltipMessage(
                        `Details will be available after ${remaining} more daily check-ins.`
                      );
                    } : () => setSelectedPhase({ phase, index })}>

                    {/* Phase number + duration */}
                    <View style={styles.weekHeaderRow}>
                      <Text style={[styles.weekLabel, isActive && styles.weekLabelActive]}>
                        FAZA {index + 1} ({phase.durationDays} ZILE)
                      </Text>
                      {isActive && (
                        <View style={styles.activeDot} />
                      )}
                    </View>

                    {/* Title */}
                    <Text style={[styles.focus, !isActive && styles.focusInactive]}>
                      {phase.title}
                    </Text>

                    {/* Purpose */}
                    <Text style={styles.target}>{phase.purpose}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {selectedPhase !== null && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPhase(null)}
        >
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedPhase(null)} />

            <View style={styles.modalSheet}>
              {/* Fixed Header Container */}
              <View style={styles.modalHeaderContainer}>
                <View style={styles.modalHeaderRowTop}>
                  <Text style={styles.modalWeekLabel}>
                    FAZA {selectedPhase.index + 1} · {selectedPhase.phase.durationDays} ZILE
                  </Text>
                  <Pressable style={styles.closeButton} onPress={() => setSelectedPhase(null)}>
                    <X size={20} color={palette.slateSubtle} />
                  </Pressable>
                </View>
                <Text style={styles.modalTitle}>{selectedPhase.phase.title}</Text>
                <Text style={styles.modalPurpose}>{selectedPhase.phase.purpose}</Text>
              </View>

              {/* Scrollable Body Content */}
              <ScrollView
                style={styles.modalScrollBody}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Entry condition */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>{`Entry condition`}</Text>
                  <View style={styles.modalConditionBar}>
                    <Text style={styles.modalConditionText}>
                      {selectedPhase.phase.entryCondition || `Phase start`}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {selectedPhase.phase.actions.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{`Daily actions`}</Text>
                    <View style={styles.modalStepsList}>
                      {selectedPhase.phase.actions.map((act, idx) => (
                        <View key={act.id} style={styles.modalStepItem}>
                          <View style={styles.modalStepNumberWrap}>
                            <Text style={styles.modalStepNumber}>{idx + 1}</Text>
                          </View>
                          <View style={styles.modalStepContent}>
                            {act.trigger && (
                              <View style={styles.modalStepMetaRow}>
                                <Text style={styles.modalStepMeta}>{act.trigger}</Text>
                                {act.duration && <Text style={styles.modalStepMeta}>{shortDuration(act.duration)}</Text>}
                              </View>
                            )}
                            <Text style={styles.modalStepActionText}>{act.action}</Text>
                            {!act.trigger && act.duration && (
                              <Text style={styles.modalStepMeta}>{shortDuration(act.duration)}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Exit condition */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>{`Exit condition`}</Text>
                  <View style={styles.modalConditionBar}>
                    <Text style={styles.modalConditionText}>
                      {selectedPhase.phase.exitCondition || `Phase end`}
                    </Text>
                  </View>
                </View>

                {/* Signals */}
                {selectedPhase.phase.signals.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{`Tracked signals`}</Text>
                    {selectedPhase.phase.signals.map((sig) => (
                      <View key={sig.id} style={styles.modalSignalRow}>
                        <View style={styles.modalSignalDot} />
                        <Text style={styles.modalSignalText}>{sig.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {tooltipMessage !== null && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setTooltipMessage(null)}
        >
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setTooltipMessage(null)} />
            <View style={styles.tooltipSheet}>
              <Text style={styles.tooltipText}>{tooltipMessage}</Text>
              <Pressable style={styles.tooltipButton} onPress={() => setTooltipMessage(null)}>
              <Text style={styles.tooltipButtonText}>{`Got it`}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    width: '100%',
    overflow: 'hidden',
    ...cardShadow,
  },
  cardScrollContent: {
    padding: spacing.xl,
    gap: spacing.xl,
  },

  /* ── Intro ── */
  introSection: {
    gap: spacing.xs + 2,
  },
  heading: {
    fontSize: typography.title + 2,
    fontWeight: '700',
    color: palette.slate,
    letterSpacing: -0.3,
  },
  summary: {
    fontSize: typography.subtitle - 1,
    lineHeight: 21,
    color: palette.slateMuted,
  },

  /* ── Week list ── */
  weekList: {
    gap: 0,
    paddingBottom: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
  },

  /* ── Timeline ── */
  timelineColumn: {
    width: 24,
    alignItems: 'center',
    position: 'relative',
    marginRight: spacing.lg - 2,
  },
  dottedLine: {
    position: 'absolute',
    top: 24,
    bottom: -24,
    left: 11,
    width: 2,
    borderStyle: 'dashed',
    borderLeftWidth: 2,
    borderColor: '#D4DBD9',
  },
  bullet: {
    width: 12,
    height: 12,
    borderRadius: radii.sm - 2,
    backgroundColor: palette.white,
    borderWidth: 2,
    borderColor: '#C2CDCA',
    marginTop: spacing.xl,
    zIndex: 2,
  },
  bulletActive: {
    borderColor: palette.teal,
    backgroundColor: palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: palette.white,
  },

  /* ── Week block ── */
  weekBlock: {
    flex: 1,
    gap: spacing.xs + 2,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg - 2,
    marginBottom: spacing.sm,
  },
  weekBlockInactive: {
    backgroundColor: 'transparent',
  },
  weekBlockActive: {
    backgroundColor: palette.sageLight,
  },

  /* ── Week header ── */
  weekHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  weekLabel: {
    fontSize: typography.caption + 1,
    fontWeight: '700',
    color: palette.slateSubtle,
    letterSpacing: 0.8,
  },
  weekLabelActive: {
    color: palette.teal,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: palette.teal,
  },

  /* ── Content ── */
  focus: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: palette.slate,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  focusInactive: {
    color: palette.slateMuted,
  },
  target: {
    fontSize: typography.body - 1,
    lineHeight: 18,
    color: palette.slateSubtle,
  },

  /* ── Modal ── */
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  modalSheet: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: palette.card,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...cardShadow,
  },
  modalHeaderContainer: {
    paddingTop: spacing.xxl + 4,
    paddingHorizontal: spacing.xxl + 4,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.sageLight,
    gap: spacing.sm,
  },
  modalHeaderRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.lg,
    backgroundColor: palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: spacing.xxl + 4,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 8,
    gap: spacing.xl,
  },
  modalWeekLabel: {
    fontSize: typography.caption + 1,
    fontWeight: '700',
    color: palette.teal,
    letterSpacing: 1.2,
  },
  modalTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: palette.slate,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  modalPurpose: {
    fontSize: typography.body,
    lineHeight: 20,
    color: palette.slateMuted,
    marginTop: 2,
  },

  /* ── Modal sections ── */
  modalSection: {
    gap: spacing.md,
  },
  modalSectionTitle: {
    fontSize: typography.subtitle - 1,
    fontWeight: '700',
    color: palette.slate,
  },
  modalConditionBar: {
    borderLeftWidth: 3,
    borderLeftColor: palette.teal,
    paddingLeft: spacing.lg - 2,
    paddingVertical: 2,
  },
  modalConditionText: {
    fontSize: typography.subtitle - 1,
    fontWeight: '600',
    color: palette.slate,
    lineHeight: 21,
  },

  /* ── Modal actions ── */
  modalStepsList: {
    gap: spacing.lg,
  },
  modalStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg - 2,
  },
  modalStepNumberWrap: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    backgroundColor: palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  modalStepNumber: {
    fontSize: typography.body - 2,
    fontWeight: '700',
    color: palette.teal,
  },
  modalStepContent: {
    flex: 1,
    gap: 3,
  },
  modalStepActionText: {
    fontSize: typography.subtitle - 1,
    fontWeight: '600',
    color: palette.slate,
    lineHeight: 21,
  },
  modalStepMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalStepMeta: {
    fontSize: typography.body - 1,
    color: palette.slateSubtle,
    lineHeight: 18,
  },

  /* ── Modal signals ── */
  modalSignalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  modalSignalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.teal,
  },
  modalSignalText: {
    fontSize: typography.body,
    color: palette.slate,
    lineHeight: 20,
  },

  /* ── Tooltip ── */
  tooltipSheet: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.xl,
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: typography.subtitle - 1,
    lineHeight: 21,
    color: palette.slate,
    textAlign: 'center',
  },
  tooltipButton: {
    backgroundColor: palette.teal,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xxl,
  },
  tooltipButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: palette.white,
  },
});
