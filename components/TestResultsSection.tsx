import * as DocumentPicker from 'expo-document-picker';
import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import CollapsibleInsightSection from '@/components/CollapsibleInsightSection';
import { Text } from '@/components/Themed';
import { categoryColors, palette } from '@/constants/theme';
import { loadTestResults, saveTestResults } from '@/lib/testResultsStorage';
import { TestResultUpload } from '@/types/health';

function formatUploadedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TestResultsSection() {
  const [expanded, setExpanded] = useState(false);
  const [results, setResults] = useState<TestResultUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadTestResults().then((saved) => {
      if (mounted) {
        setResults(saved);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const persist = (next: TestResultUpload[]) => {
    setResults(next);
    void saveTestResults(next);
  };

  const addResult = (item: Omit<TestResultUpload, 'id' | 'uploadedAt'>) => {
    const entry: TestResultUpload = {
      ...item,
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uploadedAt: new Date().toISOString(),
    };
    persist([entry, ...results]);
  };

  const pickPdf = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      addResult({
        name: asset.name ?? 'Lab results.pdf',
        uri: asset.uri,
        kind: 'pdf',
      });
    } catch {
      Alert.alert('Upload failed', 'Could not open the PDF picker. Please try again.');
    }
  };

  const pickImages = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Photo access needed',
            'Allow photo library access to upload images of your test results.'
          );
          return;
        }
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
      });
      if (picked.canceled || !picked.assets?.length) return;

      const next = picked.assets.map((asset, index) => ({
        id: `test-${Date.now()}-${index}`,
        name: asset.fileName ?? `Test result ${results.length + index + 1}.jpg`,
        uri: asset.uri,
        kind: 'image' as const,
        uploadedAt: new Date().toISOString(),
      }));
      persist([...next, ...results]);
    } catch {
      Alert.alert('Upload failed', 'Could not open your photo gallery. Please try again.');
    }
  };

  const removeResult = (id: string) => {
    persist(results.filter((r) => r.id !== id));
  };

  return (
    <CollapsibleInsightSection
      title="Test results"
      color={categoryColors.stress}
      count={results.length}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      hideBadge={results.length === 0}>
      <View style={styles.panel}>
        <Text style={styles.hint}>
          Upload lab reports, blood work, or other test results as PDFs or photos from your gallery.
        </Text>

        <View style={styles.uploadRow}>
          <Pressable
            style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}
            onPress={pickPdf}
            accessibilityRole="button"
            accessibilityLabel="Upload PDF test result">
            <SymbolView
              name={{ ios: 'doc.fill', android: 'description', web: 'description' }}
              tintColor={palette.teal}
              size={22}
            />
            <Text style={styles.uploadButtonText}>Upload PDF</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}
            onPress={pickImages}
            accessibilityRole="button"
            accessibilityLabel="Upload image from gallery">
            <SymbolView
              name={{ ios: 'photo.fill', android: 'image', web: 'image' }}
              tintColor={palette.teal}
              size={22}
            />
            <Text style={styles.uploadButtonText}>From gallery</Text>
          </Pressable>
        </View>

        {loading ? (
          <Text style={styles.empty}>Loading uploads…</Text>
        ) : results.length === 0 ? (
          <Text style={styles.empty}>No test results uploaded yet.</Text>
        ) : (
          results.map((result) => (
            <View key={result.id} style={styles.resultCard}>
              {result.kind === 'image' ? (
                <Image source={{ uri: result.uri }} style={styles.thumbnail} />
              ) : (
                <View style={styles.pdfThumb}>
                  <SymbolView
                    name={{ ios: 'doc.fill', android: 'description', web: 'description' }}
                    tintColor={palette.teal}
                    size={24}
                  />
                </View>
              )}
              <View style={styles.resultContent}>
                <Text style={styles.resultName} numberOfLines={2}>
                  {result.name}
                </Text>
                <Text style={styles.resultMeta}>
                  {result.kind === 'pdf' ? 'PDF' : 'Image'} · {formatUploadedAt(result.uploadedAt)}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                onPress={() => removeResult(result.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${result.name}`}>
                <SymbolView
                  name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                  tintColor={palette.slateMuted}
                  size={18}
                />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </CollapsibleInsightSection>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 12,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.slateMuted,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: palette.teal,
  },
  uploadButtonPressed: {
    opacity: 0.88,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.tealDark,
  },
  empty: {
    fontSize: 14,
    color: palette.slateMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: palette.background,
  },
  pdfThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate,
    marginBottom: 4,
  },
  resultMeta: {
    fontSize: 12,
    color: palette.slateMuted,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonPressed: {
    opacity: 0.6,
  },
});
