import { Link } from 'expo-router';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import RichInsightSummary from '@/components/RichInsightSummary';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { BodyInsight } from '@/types/health';

interface Props {
  insight: BodyInsight;
  style?: StyleProp<ViewStyle>;
}

export default function InsightCard({ insight, style }: Props) {
  return (
    <Link href={`/insight/${insight.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        <Text style={styles.title}>{insight.title}</Text>
        <RichInsightSummary insight={insight} numberOfLines={3} variant="card" />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: palette.slate,
  },
});
