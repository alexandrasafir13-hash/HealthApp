import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';

import ActivePlanCard from '@/components/ActivePlanCard';
import { palette } from '@/constants/theme';
import { AdaptivePlan, normalizeStoredPlan } from '@/types/plan';

type Props = {
  plan: AdaptivePlan;
  onAccept: () => void;
  error: string | null;
};

export default function PlanReviewCard({ plan, onAccept, error }: Props) {
  const normalizedPlan = normalizeStoredPlan(plan);

  return (
    <View style={styles.container}>
      <ActivePlanCard plan={normalizedPlan} activeWeekNumber={1} />

      <View style={styles.stickyFooter}>
        {error != null && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.acceptButton} onPress={onAccept} accessibilityRole="button">
          <Text style={styles.acceptButtonText}>Commit to plan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    gap: 16,
  },
  stickyFooter: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: palette.background,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: palette.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  acceptButtonText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#fff',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  error: { 
    fontSize: 13, 
    color: palette.high,
    textAlign: 'center',
  },
  disclaimer: { 
    fontSize: 12, 
    color: palette.slateSubtle,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
