import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import { HealthLlmInsight } from '@/types/healthInsights';

interface Props {
  configured: boolean;
  insight: HealthLlmInsight | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onEditCheckIn?: () => void;
  editLabel?: string;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.item}>{item}</Text>
        </View>
      ))}
    </>
  );
}

export default function HealthInsightsCard({
  configured,
  insight,
  isLoading,
  error,
  onRefresh,
  onEditCheckIn,
  editLabel = "Change today's check-in",
}: Props) {
  if (!configured) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>For you today</Text>
        <Text style={styles.body}>
          Add an OpenAI API key in `.env` to get personalized insights here. See `.env.example`.
        </Text>
        <Text style={styles.disclaimer}>Not medical advice.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>For you today</Text>

      {isLoading && !insight && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={palette.sage} />
          <Text style={styles.body}>Looking at your routine and health data…</Text>
        </View>
      )}

      {error != null && <Text style={styles.error}>{error}</Text>}

      {insight != null && (
        <>
          <Text style={styles.subheading}>Insights</Text>
          <BulletList items={insight.insights} />

          <Text style={styles.subheading}>Recommendations</Text>
          <BulletList items={insight.recommendations} />

          <Text style={styles.subheading}>Questions to sit with</Text>
          <BulletList items={insight.questions} />
        </>
      )}

      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <Pressable
            onPress={onRefresh}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Refresh insights">
            <Text style={[styles.refresh, isLoading && styles.refreshDisabled]}>
              {isLoading ? 'Updating…' : 'Refresh'}
            </Text>
          </Pressable>
          {onEditCheckIn != null && (
            <Pressable
              onPress={onEditCheckIn}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={editLabel}>
              <Text style={styles.editLink}>{editLabel}</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.disclaimer}>Not medical advice.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
    textAlign: 'left',
  },
  subheading: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate,
    marginTop: 8,
    textAlign: 'left',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
    textAlign: 'left',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.sage,
    marginTop: 1,
  },
  item: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: palette.slate,
    textAlign: 'left',
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.high,
    textAlign: 'left',
  },
  footer: {
    marginTop: 4,
    gap: 8,
    alignItems: 'flex-start',
  },
  footerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
  },
  refresh: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.teal,
  },
  refreshDisabled: {
    color: palette.slateSubtle,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slateMuted,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.slateSubtle,
    textAlign: 'left',
  },
});
