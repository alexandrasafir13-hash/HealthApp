import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import WeekOnePlanCard from '@/components/WeekOnePlanCard';
import PlanSection from '@/components/PlanSection';
import TodayPlanCheckIn from '@/components/TodayPlanCheckIn';
import DailyActionsCard from '@/components/DailyActionsCard';
import WeeklyReviewCard from '@/components/WeeklyReviewCard';
import { Text } from '@/components/Themed';
import { getDaysDifference } from '@/types/plan';
import { useHealth } from '@/context/HealthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { todayGreetingLine } from '@/lib/todayGreeting';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette, cardShadow } from '@/constants/theme';
import { localDateKey } from '@/lib/localDate';

const TAB_BAR_HEIGHT = 72;

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { pageStyle } = usePageLayout();
  const { isTabletUp } = useBreakpoint();
  const {
    profile,
    personalPlan,
    pendingPlan,
    planLoading,
    planError,
    acceptPlan,
    todayCheckInSaved,
    simulatedOffsetDays,
    activeWeek,
    activePhase,
  } = useHealth();

  useEffect(() => {
    if (!personalPlan && (planLoading || !pendingPlan)) {
      router.replace('/plan-ready');
    }
  }, [personalPlan, planLoading, pendingPlan]);

  const reviewingPlan = useMemo(
    () => !personalPlan && pendingPlan != null,
    [personalPlan, pendingPlan],
  );

  const greeting = todayGreetingLine(profile?.name);

  const isFirstDayOfActiveWeek = useMemo(() => {
    if (!personalPlan || !activeWeek) return false;
    if (activeWeek.status === 'provisional') return false; // Show review card first!
    
    const planStartKey = personalPlan.startedAt || localDateKey(new Date(personalPlan.generatedAt));
    const todayKey = localDateKey();
    const diffDays = getDaysDifference(planStartKey, todayKey);
    return diffDays >= 0 && diffDays < 28 && diffDays % 7 === 0;
  }, [personalPlan, activeWeek, simulatedOffsetDays]);

  const isCheckingIn = useMemo(() => {
    return !isFirstDayOfActiveWeek && activeWeek?.status !== 'provisional' && !todayCheckInSaved;
  }, [isFirstDayOfActiveWeek, activeWeek, todayCheckInSaved]);

  const isCheckedInToday = useMemo(() => {
    return !isFirstDayOfActiveWeek && activeWeek?.status !== 'provisional' && todayCheckInSaved;
  }, [isFirstDayOfActiveWeek, activeWeek, todayCheckInSaved]);

  const scrollPaddingTop = insets.top + (isTabletUp ? 24 : 16);

  if (reviewingPlan) {
    return (
      <ScrollView
        style={pageStyles.scroll}
        contentContainerStyle={[
          pageStyles.content,
          isTabletUp && pageStyles.contentTablet,
          {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 32,
          },
        ]}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled">
        <View style={pageStyles.pageColumn}>
          <PlanSection
            personalPlan={personalPlan}
            pendingPlan={pendingPlan}
            isLoading={planLoading}
            error={planError}
            onAcceptPlan={acceptPlan}
            choosingMode
          />
        </View>
      </ScrollView>
    );
  }

  if (!personalPlan) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={pageStyles.scroll}
        contentContainerStyle={[
          pageStyles.content,
          isTabletUp && pageStyles.contentTablet,
          styles.scrollContent,
          {
            paddingTop: scrollPaddingTop,
            paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT + 24,
          },
        ]}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled">
        <View
          style={[
            pageStyle,
            styles.page,
            (isCheckingIn || isCheckedInToday) && styles.pageCheckingIn,
            (isFirstDayOfActiveWeek || activeWeek?.status === 'provisional') && styles.pageCentered,
          ]}>
          {isCheckingIn ? (
            <>
              <View style={styles.greetingCenterContainer}>
                <Text style={[styles.greetingCenter, !isTabletUp && { fontSize: 24, lineHeight: 30 }]}>{greeting}</Text>
                <Text style={styles.greetingSub}>Ready for your daily check-in?</Text>
              </View>
              {activePhase && <DailyActionsCard phase={activePhase} />}
              <TodayPlanCheckIn />
            </>
          ) : isCheckedInToday ? (
            <>
              <View style={styles.greetingCenterContainer}>
                <Text style={[styles.greetingCenter, !isTabletUp && { fontSize: 24, lineHeight: 30 }]}>{greeting}</Text>
                <Text style={styles.greetingSub}>You're checked in for today!</Text>
              </View>
              <View style={styles.successCard}>
                <CheckCircle
                  color={palette.teal}
                  size={56}
                />
                <Text style={styles.successTitle}>You're checked in!</Text>
                <Text style={styles.successBody}>
                  Great job tracking your routines today. Come back tomorrow to check in again and keep your streak going!
                </Text>
              </View>
            </>
          ) : (
            <>
              {!isFirstDayOfActiveWeek && <Text style={[styles.greeting, !isTabletUp && { fontSize: 24, lineHeight: 30 }]}>{greeting}</Text>}
              {isFirstDayOfActiveWeek ? (
                personalPlan && (
                  <WeekOnePlanCard plan={personalPlan} weekNumber={personalPlan.activeWeekNumber} />
                )
              ) : activeWeek?.status === 'provisional' ? (
                <WeeklyReviewCard currentWeekNumber={personalPlan?.activeWeekNumber ?? 1} />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  chooserScreen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    width: '100%',
    gap: 16,
  },
  pageCheckingIn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pageCentered: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    color: palette.slate,
    textAlign: 'left',
  },
  greetingCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  greetingCenter: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    color: palette.slate,
    textAlign: 'center',
  },
  greetingSub: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.slateSubtle,
    marginTop: 8,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    width: '100%',
    ...cardShadow,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.slate,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
    textAlign: 'center',
  },
});
