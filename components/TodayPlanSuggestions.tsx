import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { categoryAttentionColor, metricScaleColors, palette } from '@/constants/theme';
import { RoutineSuggestion } from '@/lib/routineSuggestions';

interface Props {
  suggestions: RoutineSuggestion[];
  completionPct: number;
  compact?: boolean;
}

export default function TodayPlanSuggestions({ suggestions, completionPct, compact }: Props) {
  const onTrack = completionPct > 0.5;
  const accent = onTrack ? metricScaleColors.good : categoryAttentionColor;

  return (
    <View style={[styles.list, compact && styles.listCompact]}>
      {suggestions.map((item) => (
        <View
          key={item.id}
          style={[
            styles.item,
            compact && styles.itemCompact,
            { borderLeftColor: accent },
          ]}>
          <Text style={[styles.itemTitle, { color: accent }]}>{item.title}</Text>
          <Text style={styles.itemDetail}>{item.detail}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  listCompact: {
    gap: 8,
  },
  item: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 4,
  },
  itemCompact: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
});
