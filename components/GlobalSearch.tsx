import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, Platform, Modal, ScrollView } from 'react-native';
import { Search, X, MessageSquare, FileText, Bookmark } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useChat } from '@/context/ChatContext';
import { useDocumentContext } from '@/context/DocumentContext';
import { loadDocuments, DocumentEntry } from '@/lib/documentStorage';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
    
  const { sessions, caseArtifacts, selectSession } = useChat();
  const { setSelectedDocument, setPanelOpen } = useDocumentContext();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleOpenCustom = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-global-search', handleOpenCustom);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-global-search', handleOpenCustom);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadDocuments().then(setDocuments);
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  const q = query.toLowerCase().trim();

  // 1. Requests
  const matchedSessions = q ? sessions.filter(s => 
    s.title.toLowerCase().includes(q) || 
    s.messages.some(m => m.content.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  // 2. Documents
  const matchedDocuments = q ? documents.filter(d => 
    (d.name && d.name.toLowerCase().includes(q)) || 
    (d.description && d.description.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  // 3. Plans/Artifacts
  const matchedArtifacts = q ? caseArtifacts.filter(a => 
    a.title?.toLowerCase().includes(q) ||
    a.items.some(i => i.label.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const allResults = [
    ...matchedSessions.map(s => ({ kind: 'session', data: s as any })),
    ...matchedDocuments.map(d => ({ kind: 'document', data: d as any })),
    ...matchedArtifacts.map(a => ({ kind: 'artifact', data: a as any }))
  ];

  const hasResults = allResults.length > 0;

  const navigateToResult = (result: any) => {
    if (result.kind === 'session') {
      selectSession(result.data.id);
      router.push('/');
    } else if (result.kind === 'document') {
      setSelectedDocument(result.data);
      setPanelOpen(true);
      router.push('/documents');
    } else if (result.kind === 'artifact') {
      if (result.data.type === 'plan') {
        router.push('/plans');
      } else {
        router.push('/timeline');
      }
    }
    handleClose();
  };

  const handleInputKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Escape') {
      handleClose();
    } else if (e.nativeEvent.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.nativeEvent.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.nativeEvent.key === 'Enter') {
      if (hasResults && allResults[selectedIndex]) {
        navigateToResult(allResults[selectedIndex]);
      }
    }
  };

  let globalIndex = 0;

  return (
    <Modal transparent visible={isOpen} animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          
          <View style={styles.searchHeader}>
            <Search size={20} color={palette.slateMuted} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={`Search conversations, documents, saved conversations...`}
              placeholderTextColor={palette.slateMuted}
              value={query}
              onChangeText={(txt) => {
                setQuery(txt);
                setSelectedIndex(0);
              }}
              onKeyPress={handleInputKeyPress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={palette.slateMuted} />
            </Pressable>
          </View>

          {q.length > 0 && (
            <ScrollView style={styles.resultsArea} keyboardShouldPersistTaps="handled">
              {!hasResults ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>{`No results found for "${query}"`}</Text>
                </View>
              ) : (
                <>
                  {matchedSessions.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Conversations</Text>
                      {matchedSessions.map(s => {
                        const currentIndex = globalIndex++;
                        return (
                          <Pressable key={s.id} style={({ pressed }) => [styles.resultItem, (pressed || selectedIndex === currentIndex) && styles.resultItemPressed]} onPress={() => navigateToResult({ kind: 'session', data: s })}>
                            <MessageSquare size={16} color={palette.slateMuted} />
                            <Text style={styles.resultText} numberOfLines={1}>{s.title}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {matchedDocuments.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Documents</Text>
                      {matchedDocuments.map(d => {
                        const currentIndex = globalIndex++;
                        return (
                          <Pressable key={d.id} style={({ pressed }) => [styles.resultItem, (pressed || selectedIndex === currentIndex) && styles.resultItemPressed]} onPress={() => navigateToResult({ kind: 'document', data: d })}>
                            <FileText size={16} color={palette.slateMuted} />
                            <Text style={styles.resultText} numberOfLines={1}>{d.name}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  {matchedArtifacts.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{`Saved Conversations and saved items`}</Text>
                      {matchedArtifacts.map(a => {
                        const currentIndex = globalIndex++;
                        return (
                          <Pressable key={a.id} style={({ pressed }) => [styles.resultItem, (pressed || selectedIndex === currentIndex) && styles.resultItemPressed]} onPress={() => navigateToResult({ kind: 'artifact', data: a })}>
                            <Bookmark size={16} color={palette.slateMuted} />
                            <Text style={styles.resultText} numberOfLines={1}>[{a.type === 'plan' ? `Plan` : `Item`}] {a.title || `Untitled`}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: '10%',
  },
  modal: {
    width: '90%',
    maxWidth: 600,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#FAFBFA',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: palette.slateDark,
    fontFamily: 'Nunito_500Medium',
    marginLeft: 12,
    marginRight: 12,
    outlineStyle: 'none' as any,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  resultsArea: {
    maxHeight: 400,
  },
  section: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slateMuted,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  resultItemPressed: {
    backgroundColor: 'rgba(42,122,114,0.05)',
  },
  resultText: {
    flex: 1,
    fontSize: 15,
    color: palette.slate,
    fontFamily: 'Nunito_600SemiBold',
  },
  noResults: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: palette.slateMuted,
    fontFamily: 'Nunito_500Medium',
  }
});
