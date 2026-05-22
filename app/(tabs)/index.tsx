import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HealthScoreRing from '@/components/HealthScoreRing';
import InsightCard from '@/components/InsightCard';
import { Text } from '@/components/Themed';
import { bodyStatus } from '@/data/mockInsights';
import { useHealth } from '@/context/HealthContext';
import { palette } from '@/constants/theme';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { insights, profile } = useHealth();
  const greeting = profile?.name ? `Good morning, ${profile.name}` : 'Good morning';
  const priority = insights.filter((i) => i.severity === 'high' || i.severity === 'medium');
  const topInsight = priority[0] ?? insights[0];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Link href="/modal">
            <Text style={styles.infoLink}>About</Text>
          </Link>
        </View>
        <Text style={styles.tagline}>Here&apos;s what&apos;s happening in your body, and what to do about it.</Text>
      </View>

      <HealthScoreRing status={bodyStatus} />

      {topInsight && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top priority today</Text>
          <InsightCard insight={topInsight} />
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All active insights</Text>
          <Link href="/(tabs)/insights">
            <Text style={styles.link}>See all</Text>
          </Link>
        </View>
        {insights.slice(0, 2).map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </View>

      <View style={styles.predictableCard}>
        <Text style={styles.predictableTitle}>Your predictable routine</Text>
        <Text style={styles.predictableBody}>
          Same check-in time, same prevention habits, same cause → effect → action flow—so you always know what to expect.
        </Text>
        <Link href="/(tabs)/routine" style={styles.predictableLink}>
          <Text style={styles.predictableLinkText}>View today&apos;s plan →</Text>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  hero: {
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLink: {
    fontSize: 14,
    color: palette.teal,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.slate,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: palette.slate,
  },
  link: {
    fontSize: 14,
    color: palette.teal,
    fontWeight: '600',
    marginBottom: 12,
  },
  predictableCard: {
    backgroundColor: palette.tealDark,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  predictableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  predictableBody: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  predictableLink: {},
  predictableLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.sageLight,
  },
});
