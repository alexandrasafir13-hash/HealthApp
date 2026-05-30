import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PersonalRoutineSection from '@/components/PersonalRoutineSection';
import HealthInsightsCard from '@/components/HealthInsightsCard';
import TodayRoutineChecklist from '@/components/TodayRoutineChecklist';
import TodayRoutineDoneButton from '@/components/TodayRoutineDoneButton';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useHealthInsights } from '@/hooks/useHealthInsights';
import { todayGreetingLine } from '@/lib/todayGreeting';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette } from '@/constants/theme';

const TAB_BAR_HEIGHT = 56;

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { pageStyle } = usePageLayout();
  const { isTabletUp } = useBreakpoint();
  const {
    profile,
    personalRoutine,
    routineProposals,
    routineLoading,
    routineError,
    selectPersonalRoutine,
    todayShowInsights,
    editTodayRoutine,
    routineCompletionLog,
    todayRoutineSteps,
  } = useHealth();

  const [contentTop, setContentTop] = useState<number | null>(null);

  const choosingRoutine = useMemo(
    () =>
      !personalRoutine &&
      (routineLoading || (routineProposals?.options.length ?? 0) > 0),
    [personalRoutine, routineLoading, routineProposals],
  );

  const greeting = todayGreetingLine(profile?.name);

  const {
    configured: insightsConfigured,
    insight: llmInsight,
    isLoading: insightsLoading,
    error: insightsError,
    refresh: refreshInsights,
  } = useHealthInsights({
    profile,
    personalRoutine,
    todayRoutineSteps,
    routineCompletionLog,
    enabled: todayShowInsights && !choosingRoutine,
  });

  const onAnchorLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (contentTop != null || todayShowInsights || choosingRoutine) return;
      const anchorHeight = event.nativeEvent.layout.height;
      const visibleHeight = windowHeight - insets.top - insets.bottom - TAB_BAR_HEIGHT;
      const top = Math.max(insets.top + 16, (visibleHeight - anchorHeight) / 2);
      setContentTop(top);
    },
    [contentTop, todayShowInsights, choosingRoutine, insets.bottom, insets.top, windowHeight],
  );

  const scrollPaddingTop = todayShowInsights ? insets.top + 16 : (contentTop ?? insets.top + 48);

  if (choosingRoutine) {
    return (
      <View style={[pageStyles.scroll, styles.chooserScreen]}>
        <View
          style={[
            pageStyles.content,
            isTabletUp && pageStyles.contentTablet,
            styles.chooserContent,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 12,
            },
          ]}>
          <View style={[pageStyle, styles.chooserPage]}>
            <PersonalRoutineSection
              personalRoutine={personalRoutine}
              routineProposals={routineProposals}
              isLoading={routineLoading}
              error={routineError}
              onSelectRoutine={selectPersonalRoutine}
              choosingMode
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={pageStyles.scroll}
      contentContainerStyle={[
        pageStyles.content,
        isTabletUp && pageStyles.contentTablet,
        styles.scrollContent,
        {
          paddingTop: scrollPaddingTop,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24,
        },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={[pageStyle, styles.page]}>
        {!todayShowInsights ? (
          <>
            <View onLayout={onAnchorLayout}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.prompt}>Your routine for today</Text>
            </View>
            <TodayRoutineChecklist />
            <TodayRoutineDoneButton />
          </>
        ) : (
          profile && (
            <View style={styles.insightsView}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.insightsIntro}>Based on your routine today</Text>
              <HealthInsightsCard
                configured={insightsConfigured}
                insight={llmInsight}
                isLoading={insightsLoading}
                error={insightsError}
                onRefresh={refreshInsights}
                onEditCheckIn={editTodayRoutine}
                editLabel="Edit today's routine"
              />
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chooserScreen: {
    flex: 1,
  },
  chooserContent: {
    flex: 1,
  },
  chooserPage: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    width: '100%',
    gap: 16,
  },
  insightsView: {
    width: '100%',
    gap: 12,
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    color: palette.slate,
    textAlign: 'left',
  },
  prompt: {
    fontSize: 20,
    lineHeight: 28,
    color: palette.slateMuted,
    textAlign: 'left',
    marginTop: 12,
  },
  insightsIntro: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.slateMuted,
    textAlign: 'left',
  },
});
