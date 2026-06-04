import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';

import PlanReviewCard from '@/components/PlanReviewCard';
import { palette } from '@/constants/theme';
import { PlanGenerationResult } from '@/types/plan';
import { PersonalPlan } from '@/types/plan';

type Props = {
  personalPlan: PersonalPlan | null;
  pendingPlan: PlanGenerationResult | null;
  isLoading: boolean;
  error: string | null;
  onAcceptPlan: () => void;
  choosingMode?: boolean;
};

export default function PlanSection({
  personalPlan,
  pendingPlan,
  isLoading,
  error,
  onAcceptPlan,
  choosingMode = false,
}: Props) {
  if (isLoading && !pendingPlan && !personalPlan) {
    return (
      <View style={[styles.loadingWrap, choosingMode && styles.loadingWrapFull]}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your personalized plan</Text>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.sage} />
            <Text style={styles.body}>Building your adaptive plan…</Text>
          </View>
        </View>
      </View>
    );
  }

  if (pendingPlan && !personalPlan) {
    return (
      <PlanReviewCard plan={pendingPlan.plan} onAccept={onAcceptPlan} error={error} />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingWrap: {
    width: '100%',
  },
  loadingWrapFull: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 10,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.slate,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
