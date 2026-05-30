import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import PageTitle from '@/components/PageTitle';
import TodayProfileGuide from '@/components/TodayProfileGuide';
import TodayCheckInBanner from '@/components/TodayCheckInBanner';
import TodayPlanModalTrigger from '@/components/TodayPlanModalTrigger';
import TopPriorityCategories from '@/components/TopPriorityCategories';
import { useHealth } from '@/context/HealthContext';
import { getAttentionCategories } from '@/lib/insightAttention';
import { buildHealthSnapshot } from '@/lib/healthSnapshot';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';

export default function TodayScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { insights, todayCheckIn, habits, customHabits, profile, refreshTodayCheckIn, toggleHabit } =
    useHealth();
  const topPriorities = useMemo(() => getAttentionCategories(insights), [insights]);
  const healthSnapshot = useMemo(
    () =>
      profile
        ? buildHealthSnapshot(profile.weightKg, profile.heightCm, profile.age, profile.sex)
        : null,
    [profile]
  );

  const allHabits = useMemo(() => [...habits, ...customHabits], [habits, customHabits]);
  const routineCompleted = allHabits.filter((h) => h.completed).length;
  const routineTotal = allHabits.length;
  const routineCompletionPct = routineTotal > 0 ? routineCompleted / routineTotal : 0;
  const showRoutineBanner = todayCheckIn != null || routineTotal > 0;

  useFocusEffect(
    useCallback(() => {
      void refreshTodayCheckIn();
    }, [refreshTodayCheckIn])
  );

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={pageStyle}>
        <PageTitle title="Listening to your body today" friendly />
        {healthSnapshot && profile && (
          <TodayProfileGuide
            snapshot={healthSnapshot}
            name={profile.name}
            habitIds={profile.habitIds}
            habits={habits}
            checkIn={todayCheckIn}
            onToggleHabit={(id) => toggleHabit(id)}
          />
        )}
        {showRoutineBanner && (
          <TodayCheckInBanner
            checkIn={todayCheckIn}
            routineCompleted={routineCompleted}
            routineTotal={routineTotal}
          />
        )}
        <TopPriorityCategories
          items={topPriorities}
          key={
            todayCheckIn
              ? `${todayCheckIn.energy}-${todayCheckIn.sleepQuality}-${todayCheckIn.stress}-${todayCheckIn.symptoms.join(',')}-${routineCompleted}`
              : `baseline-${routineCompleted}`
          }
        />

        <View style={styles.planFooter}>
          <TodayPlanModalTrigger
            checkIn={todayCheckIn}
            habits={habits}
            customHabits={customHabits}
            completionPct={routineCompletionPct}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  planFooter: {
    marginTop: 8,
  },
});
