import { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { FileText, Trash2, Image as ImageIcon, File, CloudUpload, Calendar } from 'lucide-react-native';
import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { palette } from '@/constants/theme';
import { loadDocuments, saveDocument, deleteDocument, DocumentEntry, parseDocumentMetadata } from '@/lib/documentStorage';
import { processDocumentContents } from '@/lib/documentAi';
import { useDocumentContext } from '@/context/DocumentContext';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/context/HealthContext';
import { backupUserData } from '@/lib/firebaseSync';
import { confirmDestructiveAction } from '@/lib/confirmDestructiveAction';

const getCategory = (mime: string | undefined) => {
  if (!mime) return `Other`;
  if (mime.startsWith('image/')) return `Image`;
  if (mime === 'application/pdf') return 'PDF';
  if (mime.includes('csv') || mime.includes('excel') || mime.includes('spreadsheet')) return `Spreadsheet`;
  return `Other`;
};

export default function DocumentsScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
    const [filter, setFilter] = useState<string>(`All`);
  
  const { setSelectedDocument, setPanelOpen } = useDocumentContext();
  const { user, isAuthenticated } = useAuth();
  const { profile, personalPlan, checkInLog, planCheckInLog } = useHealth();

  const backupWorkspace = async () => {
    if (isAuthenticated && user && profile) {
      await backupUserData(user.uid, profile, personalPlan, checkInLog, planCheckInLog);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const docs = await loadDocuments();
    setDocuments(docs);
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      
      setIsProcessing(true);
      const file = result.assets[0];
      
      let aiResult: { name: string; issuedAt?: string; description?: string; clinic?: string; doctor?: string; textContent?: string };
      if (Platform.OS === 'web' && file.file) {
        aiResult = await processDocumentContents(file.file, file.name);
      } else {
        aiResult = parseDocumentMetadata(file.name);
      }

      if (aiResult.clinic || aiResult.doctor) {
        const { saveProvider } = await import('@/lib/providerStorage');
        await saveProvider({
          id: Date.now().toString() + '-prov',
          name: aiResult.doctor,
          clinic: aiResult.clinic,
          createdAt: new Date().toISOString(),
        });
      }

      const newDoc: DocumentEntry = {
        id: Date.now().toString(),
        name: aiResult.name,
        uri: result.assets[0].uri,
        size: result.assets[0].size,
        mimeType: result.assets[0].mimeType,
        createdAt: new Date().toISOString(),
        issuedAt: aiResult.issuedAt,
        description: aiResult.description,
        textContent: aiResult.textContent,
      };

      await saveDocument(newDoc);
      await fetchDocuments();
      await backupWorkspace();
    } catch (err) {
      console.error('Error uploading document', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (doc: DocumentEntry) => {
    const confirmed = await confirmDestructiveAction({
      title: 'Delete document?',
      message: `This will permanently delete "${doc.name}" from Healthy.`,
      confirmText: 'Delete document',
    });
    if (!confirmed) return;

    await deleteDocument(doc.id);
    await fetchDocuments();
    await backupWorkspace();
  };


  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleDragOver = (e: any) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: any) => {
      e.preventDefault();
      if (!e.relatedTarget) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: any) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files) {
        setIsProcessing(true);
        try {
          const files = Array.from(e.dataTransfer.files) as File[];
          const uploadPromises = files.map(async (file) => {
            const aiResult = await processDocumentContents(file, file.name);

            if (aiResult.clinic || aiResult.doctor) {
              const { saveProvider } = await import('@/lib/providerStorage');
              await saveProvider({
                id: Date.now().toString() + Math.random().toString() + '-prov',
                name: aiResult.doctor,
                clinic: aiResult.clinic,
                createdAt: new Date().toISOString(),
              });
            }

            const newDoc: DocumentEntry = {
              id: Date.now().toString() + Math.random().toString(),
              name: aiResult.name,
              uri: URL.createObjectURL(file),
              size: file.size,
              mimeType: file.type,
              createdAt: new Date().toISOString(),
              issuedAt: aiResult.issuedAt,
              description: aiResult.description,
              textContent: aiResult.textContent,
            };
            await saveDocument(newDoc);
          });
          await Promise.all(uploadPromises);
          await fetchDocuments();
          await backupWorkspace();
        } catch (err) {
          console.error('Error processing dropped files', err);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add(`All`);
    documents.forEach(doc => cats.add(getCategory(doc.mimeType)));
    return Array.from(cats);
  }, [documents]);

  const filteredDocs = useMemo(() => {
    if (filter === `All`) return documents;
    return documents.filter(doc => getCategory(doc.mimeType) === filter);
  }, [documents, filter]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={pageStyles.scroll} contentContainerStyle={contentContainerStyle}>
        <View style={pageStyle}>
          <PageTitle title={`Documents`} />

          {/* Static Dropzone */}
          <Pressable 
            style={[styles.dropZoneStatic, isDragging && styles.dropZoneStaticActive]} 
            onPress={isProcessing ? undefined : handleUpload}
            disabled={isProcessing}
          >
            <View style={styles.dropZoneContent}>
              <CloudUpload size={32} color={isDragging ? palette.teal : palette.slateMuted} />
              <Text style={styles.dropZoneTitle}>
                {isProcessing 
                  ? `Processing...` 
                  : isDragging 
                    ? `Drop here` 
                    : `Click or drag file here`}
              </Text>
              <Text style={styles.dropZoneSubtitle}>{`PDF, Images, Spreadsheets`}</Text>
            </View>
          </Pressable>

          {/* Filters */}
          {documents.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
              {categories.map(cat => (
                <Pressable
                  key={cat}
                  style={[styles.filterChip, filter === cat && styles.filterChipActive]}
                  onPress={() => setFilter(cat)}
                >
                  <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Documents List */}
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={palette.slateMuted} />
              <Text style={styles.emptyStateTitle}>{`No documents yet`}</Text>
              <Text style={styles.emptyStateText}>
                {`Upload or drag and drop documents to get started`}
              </Text>
            </View>
          ) : filteredDocs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{`No matching documents`}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredDocs.map((doc) => {
                const category = getCategory(doc.mimeType);
                let IconComponent = FileText;
                if (category === `Image`) IconComponent = ImageIcon;
                if (category === `Spreadsheet`) IconComponent = File;
                
                return (
                  <Pressable
                    key={doc.id}
                    style={styles.listItem}
                    onPress={() => {
                      setSelectedDocument(doc);
                      setPanelOpen(true);
                    }}
                  >
                    <View style={styles.listIconWrap}>
                      <IconComponent size={20} color={palette.teal} />
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={styles.listName} numberOfLines={1}>{doc.name}</Text>
                      <View style={styles.listMetaRow}>
                        {doc.issuedAt && (
                          <View style={styles.metaItem}>
                            <Calendar size={12} color={palette.slateMuted} />
                            <Text style={styles.listMetaText}>{`Issued`}: {doc.issuedAt}</Text>
                          </View>
                        )}
                        <View style={styles.metaItem}>
                          <CloudUpload size={12} color={palette.slateMuted} />
                          <Text style={styles.listMetaText}>{`Uploaded`}: {new Date(doc.createdAt).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(doc);
                      }}
                    >
                      <Trash2 size={16} color={palette.slateMuted} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dropZoneStatic: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(42,122,114,0.3)',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dropZoneStaticActive: {
    backgroundColor: 'rgba(42,122,114,0.05)',
    borderColor: palette.teal,
  },
  dropZoneContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slateDark,
    marginTop: 8,
  },
  dropZoneSubtitle: {
    fontSize: 13,
    color: palette.slateMuted,
  },
  filterBar: {
    marginBottom: 16,
  },
  filterBarContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  filterChipActive: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slateMuted,
  },
  filterChipTextActive: {
    color: '#fff',
  },
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
    fontSize: 15,
    color: palette.slateMuted,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  list: {
    gap: 12,
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
  deleteBtn: {
    padding: 8,
  },
});
