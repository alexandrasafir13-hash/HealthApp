import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import ActivePlanCard from '@/components/ActivePlanCard';
import { palette } from '@/constants/theme';
import { AdaptivePlan } from '@/types/plan';

type Props = {
  plan: AdaptivePlan;
  onAccept: () => void;
  error: string | null;
};

export default function PlanReviewCard({ plan, onAccept, error }: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <ActivePlanCard plan={plan} activeWeekNumber={1} />

      <Pressable style={styles.acceptButton} onPress={onAccept} accessibilityRole="button">
        <Text style={styles.acceptButtonText}>Start Week 1</Text>
      </Pressable>

      {error != null && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.disclaimer}>Not medical advice.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { width: '100%', flex: 1 },
  wrap: { gap: 16, width: '100%' },
  acceptButton: {
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  error: { fontSize: 13, color: palette.high },
  disclaimer: { fontSize: 12, color: palette.slateSubtle },
});
