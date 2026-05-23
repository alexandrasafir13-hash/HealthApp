import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import CollapsibleInsightSection from '@/components/CollapsibleInsightSection';
import DataSourceCard from '@/components/DataSourceCard';
import PageTitle from '@/components/PageTitle';
import TestResultsSection from '@/components/TestResultsSection';
import { Text } from '@/components/Themed';
import {
  deviceCategories,
  getAllDataSources,
  healthApps,
  manualCheckInSource,
  otherDeviceSource,
} from '@/data/dataSources';
import { useHealth } from '@/context/HealthContext';
import { dataMethodOptions } from '@/data/onboardingOptions';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { categoryColors, palette } from '@/constants/theme';
import { DataSource } from '@/types/health';

const DATA_INTRO =
  'Healthy unifies sleep, heart rate, HRV, activity, and your daily check-ins to explain patterns—not just charts.';

const CONNECTIONS_INFO =
  'When sources overlap (e.g. Apple Health + a smartwatch), we deduplicate metrics and prefer the most accurate data for each insight.';

export default function DataScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { isTabletUp } = useBreakpoint();
  const { profile } = useHealth();
  const [sources, setSources] = useState<DataSource[]>(getAllDataSources);
  const [expanded, setExpanded] = useState({ apps: false, devices: false });
  const [infoVisible, setInfoVisible] = useState(false);  const setupMethods = dataMethodOptions.filter((m) => profile?.dataMethods?.includes(m.id));

  const sourceMap = useMemo(() => {
    const map = new Map<string, DataSource>();
    for (const s of sources) map.set(s.id, s);
    return map;
  }, [sources]);

  const deviceCount = useMemo(
    () => deviceCategories.reduce((n, c) => n + c.devices.length, 0) + 1,
    []
  );

  const resolve = (source: DataSource) => sourceMap.get(source.id) ?? source;

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
    <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
      <View style={pageStyle}>
        <PageTitle
          title="Connected data"
          accessory={
            <Pressable
              style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
              onPress={() => setInfoVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="About connected data">
              <SymbolView
                name={{
                  ios: 'questionmark.circle',
                  android: 'help',
                  web: 'help',
                }}
                tintColor={palette.teal}
                size={26}
              />
            </Pressable>
          }
        />

        <Modal
          visible={infoVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setInfoVisible(false)}>
            <Pressable
              style={[styles.modalCard, isTabletUp && styles.modalCardWide]}
              onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>About connected data</Text>
                <Pressable
                  onPress={() => setInfoVisible(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close">
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                    tintColor={palette.slateMuted}
                    size={28}
                  />
                </Pressable>
              </View>
              <Text style={styles.modalBody}>{DATA_INTRO}</Text>
              <Text style={styles.modalSectionTitle}>How connections work</Text>
              <Text style={styles.modalBody}>{CONNECTIONS_INFO}</Text>
              <Pressable style={styles.modalButton} onPress={() => setInfoVisible(false)}>
                <Text style={styles.modalButtonText}>Got it</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {setupMethods.length > 0 && (          <View style={styles.setupBox}>
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

        <Text style={styles.sourcesHeading}>Your sources</Text>

        <CollapsibleInsightSection
          title="Apps"
          color={categoryColors.sleep}
          count={healthApps.length}
          expanded={expanded.apps}
          onToggle={() => setExpanded((prev) => ({ ...prev, apps: !prev.apps }))}>
          <Text style={styles.sectionSubtitle}>
            Connect health and fitness apps to import sleep, activity, heart rate, and more.
          </Text>
          {healthApps.map((app) => (
            <DataSourceCard key={app.id} source={resolve(app)} onToggle={toggleSource} />
          ))}
        </CollapsibleInsightSection>

        <CollapsibleInsightSection
          title="Devices"
          color={palette.teal}
          count={deviceCount}
          expanded={expanded.devices}
          onToggle={() => setExpanded((prev) => ({ ...prev, devices: !prev.devices }))}>
          <Text style={styles.sectionSubtitle}>
            Pair wearables and medical devices over Bluetooth—smartwatches, monitors, sensors, and
            more.
          </Text>
          {deviceCategories.map((category) => (
            <View key={category.id} style={styles.deviceCategory}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              {category.devices.map((device) => (
                <DataSourceCard key={device.id} source={resolve(device)} onToggle={toggleSource} />
              ))}
            </View>
          ))}
          <DataSourceCard source={resolve(otherDeviceSource)} onToggle={toggleSource} />
        </CollapsibleInsightSection>

        <TestResultsSection />

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Manual check-ins</Text>
        <DataSourceCard source={resolve(manualCheckInSource)} onToggle={toggleSource} />
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
  sourcesHeading: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    color: palette.slate,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.slateMuted,
    marginBottom: 12,
  },
  deviceCategory: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
    color: palette.slate,
  },
  sectionTitleSpaced: {
    marginTop: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.tealDark,
    marginBottom: 8,
    marginTop: 4,
  },
  infoButton: {
    padding: 4,
    marginTop: 2,
  },
  infoButtonPressed: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 51, 56, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalCardWide: {
    maxWidth: 440,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate,
    flex: 1,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate,
    marginBottom: 8,
    marginTop: 4,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
