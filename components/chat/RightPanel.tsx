import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  PanelRight,
  Lightbulb,
  Layers,
  Check
} from 'lucide-react-native';
import { Text } from '@/components/Themed';
import { useChat } from '@/context/ChatContext';
import { palette } from '@/constants/theme';
import { loadDocuments, type DocumentEntry } from '@/lib/documentStorage';
import { ArtifactSection } from '@/components/chat/ArtifactSection';

interface Props {
  open: boolean;
  width?: number;
  isDragging?: boolean;
  isMobile?: boolean;
  onClose: () => void;
}

export default function RightPanel({ open, width = 320, isDragging = false, isMobile = false, onClose }: Props) {
  const { caseArtifacts, activeSessionId, deleteCaseArtifact, activeSession, toggleSessionSaved } = useChat();
  const activeArtifacts = caseArtifacts.filter((a) => a.sessionId === activeSessionId);
  const [docs, setDocs] = useState<DocumentEntry[]>([]);

  useEffect(() => {
    loadDocuments().then(setDocs).catch(console.error);
  }, [open, activeSessionId]);

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

  return (
    <Animated.View style={[styles.panel, animStyle]}>
      <View style={[styles.inner, { width: width }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
            id="panel-close-btn"
          >
            <PanelRight size={18} color={palette.slateMuted} />
          </Pressable>

          <View style={{ flex: 1 }} />

          {activeSessionId ? (
            <Pressable
              style={[styles.headerSaveBtn, { flex: undefined }]}
              onPress={() => toggleSessionSaved(activeSessionId, !activeSession?.isSaved)}
            >
              <View style={[styles.checkbox, activeSession?.isSaved && styles.checkboxChecked]}>
                {activeSession?.isSaved && <Check size={12} color="#FFF" />}
              </View>
              <Text style={[styles.headerTitle, { flex: undefined }]}>Save conversation</Text>
            </Pressable>
          ) : (
            <Text style={[styles.headerTitle, { flex: undefined }]}>{`Inspector`}</Text>
          )}
        </View>

        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            const contextKeys = activeSession?.contextKeys;
            if (!contextKeys) return null;
            const hasProfile = contextKeys.profile;
            const hasMedication = contextKeys.medication;
            const activeDocs = contextKeys.documentIds?.map(id => docs.find(d => d.id === id)?.name || 'Document') || [];
            
            if (!hasProfile && !hasMedication && activeDocs.length === 0) return null;
            
            return (
              <View style={[styles.section, { marginBottom: 24 }]}>
                <View style={styles.sectionHeader}>
                  <Lightbulb size={20} color={palette.teal} />
                  <Text style={styles.sectionTitle}>{`Context`}</Text>
                </View>
                <View style={styles.compactPlan}>
                  {hasProfile && <Text style={styles.compactArtifactSubText}>• Profile information</Text>}
                  {hasMedication && <Text style={styles.compactArtifactSubText}>• Medication</Text>}
                  {activeDocs.map((d, idx) => (
                    <Text key={idx} style={styles.compactArtifactSubText} numberOfLines={1}>• Document: {d}</Text>
                  ))}
                </View>
              </View>
            );
          })()}

          {activeArtifacts.length === 0 ? (
            <View style={emptyStyles.root}>
              <View style={emptyStyles.iconWrap}>
                <Layers size={28} color="rgba(100,120,115,0.3)" />
              </View>
              <Text style={emptyStyles.sub}>{`Facts, questions, documents, and next steps will appear here.`}</Text>
            </View>
          ) : (
            <View style={{ gap: 24 }}>
              <ArtifactSection
                title="Summary"
                types={['insight', 'fact', 'document_note', 'question', 'mixed']}
                artifacts={activeArtifacts}
                onDelete={deleteCaseArtifact}
              />
              <ArtifactSection
                title="Plan"
                types={['plan', 'routine', 'goal', 'checklist', 'next_step']}
                artifacts={activeArtifacts}
                onDelete={deleteCaseArtifact}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: palette.teal,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: palette.teal,
  },
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
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: palette.slate,
    fontFamily: 'Nunito_700Bold',
  },
  compactArtifactSubText: {
    fontSize: 16,
    color: palette.slate,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 24,
  },
  compactPlan: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
  },
});

const emptyStyles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', paddingTop: 48, gap: 10, paddingHorizontal: 16 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sub: { fontSize: 13, color: palette.slateSubtle, textAlign: 'center', lineHeight: 18, maxWidth: 220, fontFamily: 'Nunito_500Medium' },
});
