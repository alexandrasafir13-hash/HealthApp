import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import CollapsibleInsightSection from '@/components/CollapsibleInsightSection';
import PriorityHeartIcon from '@/components/PriorityHeartIcon';
import RichInsightSummary from '@/components/RichInsightSummary';
import { Text } from '@/components/Themed';
import { categoryColors, palette } from '@/constants/theme';
import { AttentionCategory } from '@/lib/insightAttention';

interface Props {
  items: AttentionCategory[];
}

export default function TopPriorityCategories({ items }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (items.length === 0) return null;

  const toggle = (category: string) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <View style={styles.section}>
      {items.map((item) => (
        <CollapsibleInsightSection
          key={item.category}
          title={item.topInsight.title}
          color={categoryColors[item.category]}
          count={1}
          hideBadge
          needsAttention
          titleLeading={
            <View style={styles.priorityHeart}>
              <PriorityHeartIcon />
            </View>
          }
          expanded={expanded[item.category] ?? false}
          onToggle={() => toggle(item.category)}>
          <Link href={`/insight/${item.topInsight.id}`} asChild>
            <Pressable style={({ pressed }) => [styles.bodyCard, pressed && styles.bodyCardPressed]}>
              <Text style={styles.categoryLabel}>{item.title}</Text>
              <RichInsightSummary insight={item.topInsight} numberOfLines={4} variant="card" />
              <Text style={styles.viewLink}>View full insight →</Text>
            </Pressable>
          </Link>
        </CollapsibleInsightSection>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  priorityHeart: {
    marginTop: 1,
  },
  bodyCard: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bodyCardPressed: {
    opacity: 0.92,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slateMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.teal,
    marginTop: 12,
  },
});
