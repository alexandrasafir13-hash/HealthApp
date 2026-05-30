import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HealthInsightsCard from '@/components/HealthInsightsCard';
import TodayFeelingDetails from '@/components/TodayFeelingDetails';
import TodayFeelingPicker from '@/components/TodayFeelingPicker';
import TodaySubmitButton from '@/components/TodaySubmitButton';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useHealthInsights } from '@/hooks/useHealthInsights';
import { feelingLabelForValue } from '@/lib/feelingScale';
import { feelingPrompt, todayGreetingLine } from '@/lib/todayGreeting';
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
    todayFeeling,
    todayCheckIn,
    todayShowInsights,
    editTodayCheckIn,
    checkInLog,
    habits,
    customHabits,
  } = useHealth();

  const [contentTop, setContentTop] = useState<number | null>(null);

  const greeting = todayGreetingLine(profile?.name);
  const prompt = feelingPrompt();
  const hasSelection = todayFeeling != null;

  const feelingLabel = useMemo(() => {
    if (todayCheckIn?.energy != null) {
      return feelingLabelForValue(todayCheckIn.energy);
    }
    if (todayFeeling != null) {
      return feelingLabelForValue(todayFeeling);
    }
    return null;
  }, [todayCheckIn, todayFeeling]);

  const routineCompleted = useMemo(
    () => [...habits, ...customHabits].filter((h) => h.completed).length,
    [habits, customHabits],
  );
  const routineTotal = habits.length + customHabits.length;

  const {
    configured: insightsConfigured,
    insight: llmInsight,
    isLoading: insightsLoading,
    error: insightsError,
    refresh: refreshInsights,
  } = useHealthInsights({
    profile,
    todayCheckIn,
    routineCompleted,
    routineTotal,
    todayFeelingLabel: feelingLabel,
    checkInLog,
    enabled: todayShowInsights,
  });

  const onAnchorLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (contentTop != null || todayShowInsights) return;
      const anchorHeight = event.nativeEvent.layout.height;
      const visibleHeight = windowHeight - insets.top - insets.bottom - TAB_BAR_HEIGHT;
      const top = Math.max(insets.top + 16, (visibleHeight - anchorHeight) / 2);
      setContentTop(top);
    },
    [contentTop, todayShowInsights, insets.bottom, insets.top, windowHeight],
  );

  const scrollPaddingTop = todayShowInsights ? insets.top + 16 : (contentTop ?? insets.top + 48);

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
              <View style={styles.header}>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.prompt}>{prompt}</Text>
              </View>
              <TodayFeelingPicker />
            </View>
            {hasSelection && (
              <>
                <TodayFeelingDetails feelingValue={todayFeeling!} />
                <TodaySubmitButton />
              </>
            )}
          </>
        ) : (
          profile && (
            <View style={styles.insightsView}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.insightsIntro}>Based on your check-in today</Text>
              <HealthInsightsCard
                configured={insightsConfigured}
                insight={llmInsight}
                isLoading={insightsLoading}
                error={insightsError}
                onRefresh={refreshInsights}
                onEditCheckIn={editTodayCheckIn}
              />
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
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
    textAlign: 'center',
    marginTop: 12,
  },
  insightsIntro: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.slateMuted,
    textAlign: 'left',
  },
});
