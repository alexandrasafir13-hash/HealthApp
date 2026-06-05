
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  PanelRight,
  FileText,
  Calendar,
  HardDrive,
  ExternalLink,
  Trash2,
} from 'lucide-react-native';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { useDocumentContext } from '@/context/DocumentContext';
import * as Linking from 'expo-linking';
import { deleteDocument } from '@/lib/documentStorage';
import { confirmDestructiveAction } from '@/lib/confirmDestructiveAction';

interface Props {
  open: boolean;
  width?: number;
  isDragging?: boolean;
  onClose: () => void;
}

export default function DocumentRightPanel({ open, width = 320, isDragging = false, onClose }: Props) {
  const { selectedDocument, setSelectedDocument } = useDocumentContext();
  
  const animStyle = useAnimatedStyle(() => {
    const targetWidth = open ? width : 0;
    return {
      width: isDragging
        ? targetWidth
        : withTiming(targetWidth, {
            duration: 220,
            easing: Easing.out(Easing.cubic),
          }),
      opacity: withTiming(open ? 1 : 0, { duration: 180 }),
      overflow: 'hidden',
    };
  });

  const handleOpenExternally = () => {
    if (selectedDocument?.uri) {
      Linking.openURL(selectedDocument.uri).catch(err => {
        console.error('Failed to open document URL:', err);
      });
    }
  };

  const handleDelete = async () => {
    if (selectedDocument) {
      const confirmed = await confirmDestructiveAction({
        title: 'Delete document?',
        message: `This will permanently delete "${selectedDocument.name}" from Healthy.`,
        confirmText: 'Delete document',
      });
      if (!confirmed) return;

      // In a real app, you might want to call a context function that also refreshes the list.
      // But since deleteDocument is globally available and documents.tsx polls or refreshes,
      // we might need a way to refresh documents.tsx.
      // For now, we'll just close the panel after deleting.
      await deleteDocument(selectedDocument.id);
      setSelectedDocument(null);
      onClose();
    }
  };

  const isImage = selectedDocument?.mimeType?.startsWith('image/');

  return (
    <Animated.View style={[styles.panel, animStyle]}>
      <View style={[styles.inner, { width: width }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <PanelRight size={18} color={palette.slateMuted} />
          </Pressable>
          <Text style={[styles.headerTitle, { textAlign: 'right' }]}>Document details</Text>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {!selectedDocument ? (
            <View style={emptyStyles.root}>
              <View style={emptyStyles.iconWrap}>
                <FileText size={28} color="rgba(100,120,115,0.3)" />
              </View>
              <Text style={emptyStyles.sub}>{`Select a document to see its details here.`}</Text>
            </View>
          ) : (
            <View style={{ gap: 24 }}>
              {/* Preview */}
              <View style={styles.previewContainer}>
                {isImage ? (
                  <Image source={{ uri: selectedDocument.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderPreview}>
                    <FileText size={48} color={palette.slateMuted} />
                    <Text style={styles.placeholderText}>{`Preview unavailable`}</Text>
                  </View>
                )}
              </View>

              {/* Metadata */}
              <View style={styles.section}>
                <Text style={styles.docName}>{selectedDocument.name}</Text>
                
                {selectedDocument.description && (
                  <Text style={styles.docDescription}>{selectedDocument.description}</Text>
                )}
                
                <View style={styles.metaList}>
                  {selectedDocument.issuedAt && (
                    <View style={styles.metaRow}>
                      <Calendar size={16} color={palette.slateMuted} />
                      <View>
                        <Text style={styles.metaLabel}>Date Issued</Text>
                        <Text style={styles.metaValue}>{selectedDocument.issuedAt}</Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.metaRow}>
                    <Calendar size={16} color={palette.slateMuted} />
                    <View>
                      <Text style={styles.metaLabel}>{`Upload date`}</Text>
                      <Text style={styles.metaValue}>{new Date(selectedDocument.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  {selectedDocument.size !== undefined && (
                    <View style={styles.metaRow}>
                      <HardDrive size={16} color={palette.slateMuted} />
                      <View>
                        <Text style={styles.metaLabel}>{`File size`}</Text>
                        <Text style={styles.metaValue}>{(selectedDocument.size / 1024).toFixed(1)} KB</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsList}>
                <Pressable style={styles.actionBtn} onPress={handleOpenExternally}>
                  <ExternalLink size={16} color={palette.teal} />
                  <Text style={styles.actionBtnText}>Open externally</Text>
                </Pressable>
                
                <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete}>
                  <Trash2 size={16} color={palette.danger || '#ef4444'} />
                  <Text style={[styles.actionBtnText, { color: palette.danger || '#ef4444' }]}>{`Delete document`}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.07)',
    backgroundColor: '#FAFBFA',
  },
  inner: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFBFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  previewContainer: {
    width: '100%',
    height: 200,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  placeholderText: {
    fontSize: 13,
    color: palette.slateMuted,
    fontFamily: 'Nunito_600SemiBold',
  },
  section: {
    gap: 16,
  },
  docName: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slateDark,
    fontFamily: 'Nunito_700Bold',
  },
  docDescription: {
    fontSize: 14,
    color: palette.slateMuted,
    fontFamily: 'Nunito_500Medium',
    lineHeight: 20,
    marginTop: -8,
  },
  metaList: {
    gap: 16,
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: palette.slateMuted,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    color: palette.slateDark,
    fontFamily: 'Nunito_600SemiBold',
  },
  actionsList: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(42,122,114,0.08)',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.teal,
    fontFamily: 'Nunito_700Bold',
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
});

const emptyStyles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', paddingTop: 48, gap: 10, paddingHorizontal: 16 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sub: { fontSize: 13, color: palette.slateSubtle, textAlign: 'center', lineHeight: 18, maxWidth: 220, fontFamily: 'Nunito_500Medium' },
});
