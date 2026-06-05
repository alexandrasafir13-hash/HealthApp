import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Stethoscope, Trash2, Building2, User } from 'lucide-react-native';
import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette } from '@/constants/theme';
import { loadProviders, deleteProvider, ProviderEntry } from '@/lib/providerStorage';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/context/HealthContext';
import { backupUserData } from '@/lib/firebaseSync';
import { confirmDestructiveAction } from '@/lib/confirmDestructiveAction';

export default function ProvidersScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
    const [providers, setProviders] = useState<ProviderEntry[]>([]);
  const { user, isAuthenticated } = useAuth();
  const { profile, personalPlan, checkInLog, planCheckInLog } = useHealth();

  const backupWorkspace = async () => {
    if (isAuthenticated && user && profile) {
      await backupUserData(user.uid, profile, personalPlan, checkInLog, planCheckInLog);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    const data = await loadProviders();
    setProviders(data);
  };

  const handleDelete = async (provider: ProviderEntry) => {
    const label = provider.name || provider.clinic || 'this provider';
    const confirmed = await confirmDestructiveAction({
      title: 'Delete provider?',
      message: `This will permanently delete ${label} from Healthy.`,
      confirmText: 'Delete provider',
    });
    if (!confirmed) return;

    await deleteProvider(provider.id);
    await fetchProviders();
    await backupWorkspace();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
        <View style={pageStyle}>
          <PageTitle title={`Providers`} />

          {providers.length === 0 ? (
            <View style={styles.emptyState}>
              <Stethoscope size={48} color={palette.slateMuted} />
              <Text style={styles.emptyStateTitle}>{`No providers yet`}</Text>
              <Text style={styles.emptyStateText}>
                {`When you upload medical documents, we will automatically extract and save your doctors and clinics here.`}
              </Text>
            </View>
          ) : (
            <View style={[styles.table, { marginTop: 24 }]}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>{`Name`}</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>{`Clinic`}</Text>
                <View style={{ width: 40 }} />
              </View>
              {providers.map((provider, index) => (
                <View key={provider.id} style={[styles.tableRow, index !== providers.length - 1 && styles.tableRowBorder]}>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                    {provider.name || `-`}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                    {provider.clinic || `-`}
                  </Text>
                  <View style={{ width: 40, alignItems: 'center' }}>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(provider)}
                    >
                      <Trash2 size={16} color={palette.slateMuted} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginTop: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slateDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: palette.slateMuted,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  table: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableHeader: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableCell: {
    fontSize: 14,
    color: palette.slateDark,
    paddingRight: 8,
  },
  tableHeaderText: {
    fontWeight: '600',
    color: palette.slateMuted,
  },
  deleteBtn: {
    padding: 8,
  },
});
