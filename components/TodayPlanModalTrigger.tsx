import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import RoutineOutlineLabel from '@/components/RoutineOutlineLabel';
import TodayPlanSuggestions from '@/components/TodayPlanSuggestions';
import { categoryAttentionColor, metricScaleColors, palette } from '@/constants/theme';
import { getRoutineSuggestions } from '@/lib/routineSuggestions';
import { CustomHabit, DailyCheckIn, PreventionHabit } from '@/types/health';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface Props {
  checkIn: DailyCheckIn | null;
  habits: PreventionHabit[];
  customHabits: CustomHabit[];
  completionPct: number;
}

export default function TodayPlanModalTrigger({
  checkIn,
  habits,
  customHabits,
  completionPct,
}: Props) {
  const [visible, setVisible] = useState(false);
  const { isTabletUp } = useBreakpoint();
  const onTrack = completionPct > 0.5;

  const suggestions = useMemo(
    () => getRoutineSuggestions(checkIn, habits, customHabits),
    [checkIn, habits, customHabits]
  );

  return (
    <>
      <RoutineOutlineLabel
        label="View today's plan"
        onPress={() => setVisible(true)}
        accessibilityLabel="View today's plan"
      />

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.card, isTabletUp && styles.cardWide]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Today&apos;s plan</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={12} accessibilityLabel="Close">
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                  tintColor={palette.slateMuted}
                  size={28}
                />
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              Based on your routine checks{checkIn ? ' and daily check-in' : ''}.
            </Text>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: onTrack ? metricScaleColors.goodBg : metricScaleColors.cautionBg,
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  { color: onTrack ? metricScaleColors.good : categoryAttentionColor },
                ]}>
                {Math.round(completionPct * 100)}% of routine checks complete
              </Text>
            </View>
            <ScrollView style={styles.suggestionsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <TodayPlanSuggestions suggestions={suggestions} completionPct={completionPct} compact />
            </ScrollView>
            <Link href="/(tabs)/routine" asChild onPress={() => setVisible(false)}>
              <Pressable style={styles.cta}>
                <Text style={styles.ctaText}>Open full routine →</Text>
              </Pressable>
            </Link>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 51, 56, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 14,
  },
  cardWide: {
    maxWidth: 480,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.slate,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  suggestionsScroll: {
    maxHeight: 320,
  },
  cta: {
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
