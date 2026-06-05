import { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Clock } from 'lucide-react-native';
import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette } from '@/constants/theme';
import { useChat } from '@/context/ChatContext';
import { loadDocuments, DocumentEntry } from '@/lib/documentStorage';

interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  requestName?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TimelineScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { caseArtifacts, sessions } = useChat();
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadDocuments().then(setDocuments);
    }, [])
  );

  const events = useMemo(() => {
    const allEvents: TimelineEvent[] = [];

    // 1. Case Artifacts
    caseArtifacts.forEach(event => {
      const session = sessions.find(s => s.id === event.sessionId);
      allEvents.push({
        id: `artifact-${event.id}`,
        date: event.savedAt,
        type: event.type === 'plan' ? 'plan' : event.type,
        title: event.title || `No title`,
        requestName: session?.title,
      });
    });

    // 2. Saved Conversations
    sessions.forEach(session => {
      if (session.isSaved) {
        allEvents.push({
          id: `session-${session.id}`,
          date: session.updatedAt,
          type: 'conversation',
          title: session.title,
        });
      }
    });

    // 3. Uploaded Documents
    documents.forEach(doc => {
      allEvents.push({
        id: `doc-${doc.id}`,
        date: doc.createdAt,
        type: 'document',
        title: doc.name,
      });
    });

    // Future-proofing for medications (would just be pushed to allEvents here)

    return allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [caseArtifacts, sessions, documents]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
        <View style={pageStyle}>
          <PageTitle title={`Timeline`} />

          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={48} color={palette.slateMuted} />
              <Text style={styles.emptyStateTitle}>{`Timeline is empty`}</Text>
              <Text style={styles.emptyStateText}>
                {`Saved items will appear here in chronological order.`}
              </Text>
            </View>
          ) : (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>{`Date`}</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>{`Type`}</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>{`Title`}</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>{`Request`}</Text>
              </View>
              {events.map((event, index) => (
                <View key={event.id} style={[styles.tableRow, index !== events.length - 1 && styles.tableRowBorder]}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatDate(event.date)}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textTransform: 'capitalize' }]}>{event.type}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{event.title}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{event.requestName || `-`}</Text>
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
  }
});
