import { ScrollView, StyleSheet, View } from 'react-native';
import { ClipboardList } from 'lucide-react-native';

import ActivePlanCard from '@/components/ActivePlanCard';
import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette, cardShadow } from '@/constants/theme';

export default function PlanScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { personalPlan, isReady } = useHealth();

  if (!isReady) return null;

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={pageStyle}>
        <PageTitle title="My active plan" />

        {personalPlan ? (
          <ActivePlanCard
            plan={personalPlan}
            activeWeekNumber={personalPlan.activeWeekNumber}
            showIntro={true}
          />
        ) : (
          <View style={styles.emptyCard}>
            <ClipboardList
              color={palette.slateSubtle}
              size={48}
            />
            <Text style={styles.emptyTitle}>No active plan yet</Text>
            <Text style={styles.emptyBody}>
              Complete onboarding to generate your personalized wellness plan and track your daily routines.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    width: '100%',
    ...cardShadow,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    textAlign: 'center',
  },
});
