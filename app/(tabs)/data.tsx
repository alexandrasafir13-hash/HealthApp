import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DataSourceCard from '@/components/DataSourceCard';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { dataMethodOptions } from '@/data/onboardingOptions';
import { mockDataSources } from '@/data/mockSources';
import { palette } from '@/constants/theme';

export default function DataScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useHealth();
  const [sources, setSources] = useState(mockDataSources);
  const setupMethods = dataMethodOptions.filter((m) => profile?.dataMethods?.includes(m.id));

  const toggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              connected: !s.connected,
              lastSync: !s.connected ? 'Just now' : undefined,
            }
          : s
      )
    );
  };

  const connected = sources.filter((s) => s.connected);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Connected data</Text>
      <Text style={styles.subtitle}>
        Healthy unifies sleep, heart rate, HRV, activity, and your daily check-ins to explain patterns—not just charts.
      </Text>

      {setupMethods.length > 0 && (
        <View style={styles.setupBox}>
          <Text style={styles.setupTitle}>Your setup</Text>
          <Text style={styles.setupBody}>
            {setupMethods.map((m) => m.title).join(' · ')}
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <StatBox value={String(connected.length)} label="Sources linked" />
        <StatBox value="12" label="Metrics active" />
        <StatBox value="12m" label="Last sync" />
      </View>

      <Text style={styles.sectionTitle}>Your sources</Text>
      {sources.map((source) => (
        <DataSourceCard key={source.id} source={source} onToggle={toggleSource} />
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How connections work</Text>
        <Text style={styles.infoBody}>
          When sources overlap (e.g. Apple Health + Oura), we deduplicate metrics and prefer the most accurate signal for each insight.
        </Text>
      </View>
    </ScrollView>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.slate,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 20,
  },
  setupBox: {
    backgroundColor: palette.sageLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.tealDark,
    marginBottom: 4,
  },
  setupBody: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.slateMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.teal,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: palette.slateMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: palette.slate,
  },
  infoBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: palette.sageLight,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: palette.tealDark,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.slateMuted,
  },
});
