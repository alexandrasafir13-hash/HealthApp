import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import CollapsibleInsightSection from '@/components/CollapsibleInsightSection';
import InsightCard from '@/components/InsightCard';
import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { categoryColors, flowBlue, palette } from '@/constants/theme';
import { capitalizeSentences } from '@/lib/formatText';
import { categoryNeedsAttention } from '@/lib/insightAttention';
import { useHealth } from '@/context/HealthContext';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { BodyInsight, InsightCategory } from '@/types/health';

type SectionKey = 'sleep' | 'recovery' | 'stress' | 'prevention';

const INSIGHTS_INFO_TEXT =
  'Every insight follows cause → effect → action so you understand why, what it means, and what to do.';

const INSIGHT_SECTIONS: { key: SectionKey; title: string; category: InsightCategory }[] = [
  { key: 'sleep', title: 'Sleep', category: 'sleep' },
  { key: 'recovery', title: 'Recovery', category: 'recovery' },
  { key: 'stress', title: 'Stress', category: 'stress' },
  { key: 'prevention', title: 'Prevention', category: 'immunity' },
];

function InsightCardGrid({
  items,
  isTabletUp,
}: {
  items: BodyInsight[];
  isTabletUp: boolean;
}) {
  const useGrid = isTabletUp && items.length > 1;

  return (
    <View style={[styles.cardGrid, useGrid && styles.cardGridWide]}>
      {items.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          style={useGrid ? styles.cardGridItem : undefined}
        />
      ))}
    </View>
  );
}

export default function InsightsScreen() {
  const { insights } = useHealth();
  const { contentContainerStyle, pageStyle, isDesktop } = usePageLayout();
  const { isTabletUp } = useBreakpoint();

  const grouped = useMemo(() => {
    const map: Record<InsightCategory, BodyInsight[]> = {
      sleep: [],
      recovery: [],
      immunity: [],
      stress: [],
      activity: [],
    };
    for (const insight of insights) {
      map[insight.category].push(insight);
    }
    return map;
  }, [insights]);

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    sleep: false,
    recovery: false,
    stress: false,
    prevention: false,
  });
  const [infoVisible, setInfoVisible] = useState(false);

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={[pageStyle, isDesktop && styles.pageDesktop]}>
        <PageTitle
          title="Body insights"
          accessory={
            <Pressable
              style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
              onPress={() => setInfoVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="About body insights">
              <SymbolView
                name={{ ios: 'info.circle', android: 'info', web: 'info' }}
                tintColor={palette.teal}
                size={26}
              />
            </Pressable>
          }
        />

        <Modal
          visible={infoVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setInfoVisible(false)}>
            <Pressable
              style={[styles.modalCard, isTabletUp && styles.modalCardWide]}
              onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>How insights work</Text>
                <Pressable
                  onPress={() => setInfoVisible(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close">
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                    tintColor={palette.slateMuted}
                    size={28}
                  />
                </Pressable>
              </View>
              <Text style={styles.modalBody}>{INSIGHTS_INFO_TEXT}</Text>
              <Pressable style={styles.modalButton} onPress={() => setInfoVisible(false)}>
                <Text style={styles.modalButtonText}>Got it</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <View style={[styles.legend, isTabletUp && styles.legendWide]}>
          <LegendItem color={flowBlue} label="Cause — what triggered it" wide={isTabletUp} />
          <LegendItem color={flowBlue} label="Effect — what your body is doing" wide={isTabletUp} />
          <LegendItem color={flowBlue} label="Action — what to do next" wide={isTabletUp} />
        </View>

        <View style={isDesktop && styles.sectionsDesktop}>
          {INSIGHT_SECTIONS.map((section) => {
            const items = grouped[section.category];
            const color = categoryColors[section.category];
            const needsAttention = categoryNeedsAttention(insights, section.category);

            return (
              <CollapsibleInsightSection
                key={section.key}
                title={section.title}
                color={color}
                count={items.length}
                needsAttention={needsAttention}
                expanded={expanded[section.key]}
                onToggle={() => toggle(section.key)}
                compact={isDesktop}>
                {items.length > 0 ? (
                  <InsightCardGrid items={items} isTabletUp={isTabletUp} />
                ) : (
                  <View style={styles.emptySection}>
                    <RNText style={styles.emptyText}>
                      {capitalizeSentences('No active insights in this area right now.')}
                    </RNText>
                  </View>
                )}
              </CollapsibleInsightSection>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function LegendItem({
  color,
  label,
  wide,
}: {
  color: string;
  label: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.legendItem, wide && styles.legendItemWide]}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, wide && styles.legendTextWide]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageDesktop: {
    width: '100%',
  },
  infoButton: {
    padding: 4,
    marginTop: 2,
  },
  infoButtonPressed: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 51, 56, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalCardWide: {
    maxWidth: 440,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
    flex: 1,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  legend: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  legendWide: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendItemWide: {
    flex: 1,
    alignItems: 'flex-start',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  legendText: {
    fontSize: 13,
    color: palette.slateMuted,
    flex: 1,
  },
  legendTextWide: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionsDesktop: {
    gap: 4,
  },
  cardGrid: {
    width: '100%',
  },
  cardGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 0,
  },
  cardGridItem: {
    width: '48%',
    marginBottom: 12,
  },
  emptySection: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyText: {
    fontSize: 14,
    color: palette.slateMuted,
    textAlign: 'center',
  },
});
