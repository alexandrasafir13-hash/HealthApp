import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { palette } from '@/constants/theme';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { continueAsGuest } = useHealth();
  const { pageStyle, isTabletUp } = usePageLayout();
  const [loading, setLoading] = useState(false);

  const onGuest = async () => {
    setLoading(true);
    try {
      await continueAsGuest();
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={pageStyles.scroll}>
      <View style={[styles.shell, isTabletUp && styles.shellTablet]}>
        <View
          style={[
            styles.page,
            pageStyle,
            isTabletUp ? styles.pageTablet : styles.pagePhone,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 },
          ]}>
          <View style={styles.hero}>
            <Image source={require('../assets/images/icon.png')} style={styles.icon} resizeMode="contain" />
            <Text style={styles.title}>Welcome to Healthy</Text>
            <Text style={styles.subtitle}>
              Understand what your body is telling you—then know what to do next.
            </Text>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={styles.setupLink}
              onPress={() => router.push('/onboarding')}
              accessibilityRole="button"
              accessibilityLabel="Set up your profile">
              <Text style={styles.setupLinkText}>Set up your profile</Text>
            </Pressable>
            <Pressable
              style={[styles.guestButton, loading && styles.guestButtonDisabled]}
              onPress={onGuest}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Continue as guest">
              <Text style={styles.guestButtonText}>{loading ? 'Loading…' : 'Continue as guest'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
  },
  shellTablet: {
    alignItems: 'center',
  },
  page: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pagePhone: {
    paddingHorizontal: 20,
  },
  pageTablet: {
    paddingHorizontal: 32,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  icon: {
    width: 112,
    height: 112,
    borderRadius: 24,
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.slate,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.slateMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    gap: 14,
    paddingTop: 24,
  },
  setupLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  setupLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.teal,
  },
  guestButton: {
    backgroundColor: palette.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  guestButtonDisabled: {
    opacity: 0.45,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
