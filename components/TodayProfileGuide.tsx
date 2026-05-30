import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { metricScaleColors, palette } from '@/constants/theme';
import { HealthSnapshot } from '@/lib/healthSnapshot';
import {
  buildProfileGuideSuggestions,
  ProfileGuideSuggestion,
} from '@/lib/healthSnapshotSuggestions';
import { DailyCheckIn, PreventionHabit } from '@/types/health';

interface Props {
  snapshot: HealthSnapshot;
  name?: string;
  habitIds: string[];
  habits: PreventionHabit[];
  checkIn: DailyCheckIn | null;
  onToggleHabit: (id: string) => void;
}

function GuideItem({
  item,
  onToggleHabit,
}: {
  item: ProfileGuideSuggestion;
  onToggleHabit: (id: string) => void;
}) {
  const done = item.completed === true;

  const actionButton = (
    <Pressable
      style={[styles.action, done && styles.actionDone]}
      onPress={() => {
        if (item.action.type === 'habit' && !done) {
          onToggleHabit(item.action.habitId);
        }
      }}
      disabled={done || item.action.type === 'routine'}
      accessibilityRole="button"
      accessibilityState={{ disabled: done || item.action.type === 'routine' }}>
      <Text style={[styles.actionText, done && styles.actionTextDone]}>{item.actionLabel}</Text>
    </Pressable>
  );

  return (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemBody}>{item.body}</Text>
      {item.action.type === 'routine' ? (
        <Link href="/(tabs)/routine" asChild>
          <Pressable style={styles.action} accessibilityRole="button">
            <Text style={styles.actionText}>{item.actionLabel}</Text>
          </Pressable>
        </Link>
      ) : (
        actionButton
      )}
    </View>
  );
}

export default function TodayProfileGuide({
  snapshot,
  name,
  habitIds,
  habits,
  checkIn,
  onToggleHabit,
}: Props) {
  const firstName = name?.trim().split(/\s+/)[0];
  const suggestions = buildProfileGuideSuggestions(snapshot, habitIds, habits, checkIn);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {firstName ? `${firstName}, your focus for today` : 'Your focus for today'}
        </Text>
        <Text style={styles.intro}>
          A few simple steps based on your profile. Tap to log — no numbers dashboard needed.
        </Text>
      </View>

      <View style={styles.list}>
        {suggestions.map((item) => (
          <GuideItem key={item.id} item={item} onToggleHabit={onToggleHabit} />
        ))}
      </View>

      <Text style={styles.footer}>Estimates only — not medical advice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    gap: 10,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
  list: {
    gap: 10,
  },
  item: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate,
  },
  itemBody: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.slateMuted,
  },
  action: {
    alignSelf: 'flex-start',
    backgroundColor: palette.teal,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  actionDone: {
    backgroundColor: metricScaleColors.goodBg,
    borderWidth: 1,
    borderColor: metricScaleColors.good + '55',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  actionTextDone: {
    color: metricScaleColors.good,
  },
  footer: {
    fontSize: 12,
    lineHeight: 17,
    color: palette.slateSubtle,
  },
});
