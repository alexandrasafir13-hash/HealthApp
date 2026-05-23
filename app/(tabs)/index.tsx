import { Link } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import PageTitle from '@/components/PageTitle';
import TopPriorityCategories from '@/components/TopPriorityCategories';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { getAttentionCategories } from '@/lib/insightAttention';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette } from '@/constants/theme';

export default function TodayScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { insights } = useHealth();
  const topPriorities = useMemo(() => getAttentionCategories(insights), [insights]);

  return (
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={pageStyle}>
        <PageTitle title="Listening to your body today" friendly />
        <TopPriorityCategories items={topPriorities} />

        <View style={styles.predictableCard}>
          <Text style={styles.predictableTitle}>Your predictable routine</Text>
          <Text style={styles.predictableBody}>
            Same check-in time, same prevention habits, same cause → effect → action flow—so you always know what to expect.
          </Text>
          <Link href="/(tabs)/routine" style={styles.predictableLink}>
            <Text style={styles.predictableLinkText}>View today&apos;s plan →</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
