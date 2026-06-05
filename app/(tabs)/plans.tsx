import { useFocusEffect } from 'expo-router';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Layers, Bookmark, Calendar } from 'lucide-react-native';
import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette } from '@/constants/theme';
import { useChat } from '@/context/ChatContext';
import { useHealth } from '@/context/HealthContext';
import ActivePlanCard from '@/components/ActivePlanCard';
import { loadDocuments, type DocumentEntry } from '@/lib/documentStorage';
import { ArtifactSection } from '@/components/chat/ArtifactSection';

export default function PlansScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { caseArtifacts, sessions, markSavedConversationsViewed, lastViewedSavedConversationsAt } = useChat();
  const { personalPlan } = useHealth();
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Keep a snapshot of the last viewed time when the screen mounts, so dots don't vanish immediately
  const [snapshotLastViewed] = useState(lastViewedSavedConversationsAt);

  useEffect(() => {
    loadDocuments().then(setDocuments).catch(console.error);
  }, []);

  useFocusEffect(
    useCallback(() => {
      markSavedConversationsViewed();
    }, [markSavedConversationsViewed])
  );
  
  const savedSessions = useMemo(() => {
    return sessions
      .filter((s) => s.isSaved)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [sessions]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  if (selectedSession) {
    const sessionArtifacts = caseArtifacts.filter(a => a.sessionId === selectedSession.id);
    return (
      <View style={{ flex: 1 }}>
        <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
          <View style={pageStyle}>
            <PageTitle 
              title={selectedSession.title || `Saved Conversation`} 
              onBack={() => setSelectedSessionId(null)} 
            />
            
            <View style={{ gap: 24 }}>
              {(() => {
                const contextKeys = selectedSession.contextKeys;
                if (!contextKeys) return null;
                
                const hasProfile = contextKeys.profile;
                const hasMedication = contextKeys.medication;
                const activeDocs = contextKeys.documentIds?.map(id => documents.find(d => d.id === id)?.name || 'Document') || [];
                
                if (!hasProfile && !hasMedication && activeDocs.length === 0) return null;
                
                return (
                  <View style={detailsStyles.section}>
                    <View style={detailsStyles.sectionHeader}>
                      <Layers size={14} color={palette.teal} />
                      <Text style={detailsStyles.sectionTitle}>{`Context`}</Text>
                    </View>
                    <View style={detailsStyles.compactPlan}>
                      {hasProfile && <Text style={detailsStyles.compactArtifactSubText}>• Profile information</Text>}
                      {hasMedication && <Text style={detailsStyles.compactArtifactSubText}>• Medication</Text>}
                      {activeDocs.map((d, idx) => (
                        <Text key={idx} style={detailsStyles.compactArtifactSubText} numberOfLines={1}>• Document: {d}</Text>
                      ))}
                    </View>
                  </View>
                );
              })()}

              <ArtifactSection
                title="Summary"
                types={['insight', 'fact', 'document_note', 'question', 'mixed']}
                artifacts={sessionArtifacts}
              />
              <ArtifactSection
                title="Plan"
                types={['plan', 'routine', 'goal', 'checklist', 'next_step']}
                artifacts={sessionArtifacts}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
        <View style={pageStyle}>
          <PageTitle title={`Saved Conversations`} />

          {personalPlan && (
            <View style={styles.activePlanSection}>
              <Text style={styles.sectionTitle}>{`Plan`}</Text>
              <ActivePlanCard
                plan={personalPlan}
                activeWeekNumber={personalPlan.activeWeekNumber}
                showIntro={true}
              />
            </View>
          )}

          {savedSessions.length === 0 && !personalPlan ? (
            <View style={styles.emptyState}>
              <Bookmark size={48} color={palette.slateMuted} />
              <Text style={styles.emptyStateTitle}>{`No active plans`}</Text>
              <Text style={styles.emptyStateText}>
                {`Your active and saved plans will appear here.`}
              </Text>
            </View>
          ) : savedSessions.length > 0 ? (
            <View style={styles.list}>
              {savedSessions.map((session) => {
                const sessionArtifacts = caseArtifacts.filter(a => a.sessionId === session.id);
                const totalItems = sessionArtifacts.reduce((sum, a) => sum + (a.items?.length || 0), 0);
                return (
                  <Pressable
                    key={session.id}
                    style={styles.listItem}
                    onPress={() => setSelectedSessionId(session.id)}
                  >
                    <View style={styles.listIconWrap}>
                      <Bookmark size={20} color={palette.teal} />
                    </View>
                    <View style={styles.listInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={[styles.listName, { marginBottom: 0 }]} numberOfLines={1}>{session.title || `Saved Conversation`}</Text>
                        {session.savedAt && (!snapshotLastViewed || new Date(session.savedAt) > new Date(snapshotLastViewed)) && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <View style={styles.listMetaRow}>
                        <View style={styles.metaItem}>
                          <Calendar size={12} color={palette.slateMuted} />
                          <Text style={styles.listMetaText}>{new Date(session.updatedAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.listMetaText}>{totalItems} {totalItems === 1 ? `item` : `items`}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
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
  list: {
    gap: 12,
  },
  activePlanSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  listIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(42,122,114,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listInfo: {
    flex: 1,
    marginRight: 12,
  },
  listName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slateDark,
    marginBottom: 4,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listMetaText: {
    fontSize: 12,
    color: palette.slateMuted,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.teal,
  }
});

const detailsStyles = StyleSheet.create({
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: palette.slate, fontFamily: 'Nunito_700Bold' },
  compactArtifactSubText: { fontSize: 16, color: palette.slate, fontFamily: 'Nunito_600SemiBold', lineHeight: 24 },
  compactPlan: { backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 16 },
});
