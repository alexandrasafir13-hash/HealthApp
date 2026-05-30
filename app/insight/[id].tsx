import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import CauseEffectAction from '@/components/CauseEffectAction';
import RichInsightSummary from '@/components/RichInsightSummary';
import { Text } from '@/components/Themed';
import { categoryColors, palette, severityColors } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/insightAttention';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';

export default function InsightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { insights, completedActions, completeAction } = useHealth();
  const insight = insights.find((i) => i.id === id);

  if (!insight) {
    return (
      <View style={styles.centered}>
        <Text>Insight not found</Text>
      </View>
    );
  }

  const severityColor = severityColors[insight.severity];
  const categoryColor = categoryColors[insight.category];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Body insight',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
        <View style={pageStyle}>
        <View style={styles.badges}>
          <View style={[styles.pill, { backgroundColor: categoryColor + '22' }]}>
            <Text style={[styles.pillText, { color: categoryColor }]}>
              {CATEGORY_DISPLAY_NAMES[insight.category]}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: severityColor + '22' }]}>
            <Text style={[styles.pillText, { color: severityColor }]}>
              {insight.severity} priority
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{insight.title}</Text>
        <RichInsightSummary insight={insight} variant="detail" />

        <CauseEffectAction insight={insight} />

        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Mark actions complete</Text>
          {insight.actions.map((action) => {
            const key = `${insight.id}:${action.id}`;
            const done = completedActions.has(key);
            return (
              <Pressable
                key={action.id}
                style={[styles.actionCard, done && styles.actionCardDone]}
                onPress={() => completeAction(insight.id, action.id)}>
                <View style={[styles.actionCheck, done && styles.actionCheckDone]}>
                  {done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.actionBody}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDesc}>{action.description}</Text>
                  {action.duration && (
                    <Text style={styles.actionDuration}>{action.duration}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Healthy explains patterns from your data—it does not diagnose illness. See a clinician if symptoms worsen or persist.
          </Text>
        </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    color: palette.slate,
  },
  actionsSection: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  actionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    color: palette.slate,
  },
  actionCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  actionCardDone: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  actionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCheckDone: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBody: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: palette.slate,
  },
  actionDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.slateMuted,
  },
  actionDuration: {
    fontSize: 12,
    color: palette.teal,
    fontWeight: '600',
    marginTop: 6,
  },
  disclaimer: {
    marginTop: 24,
    padding: 14,
    backgroundColor: palette.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.slateMuted,
    textAlign: 'center',
  },
});
