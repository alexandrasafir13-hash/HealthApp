import { useRouter } from 'expo-router';
import { Pressable, Platform, StyleSheet, View, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';

import HeartHandshakeLogo from '@/components/HeartHandshakeLogo';
import { Text } from '@/components/Themed';
import { palette, cardShadow } from '@/constants/theme';
import { pageStyles } from '@/hooks/usePageLayout';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/context/HealthContext';

export default function PlanReadyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, signInWithGoogle, loading: authLoading } = useAuth();
  const { pendingPlan, planLoading, personalPlan, planError } = useHealth();

  // Pulse animation for loading state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (planLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1.0);
    }
  }, [planLoading]);

  // If a plan is already active, direct to tabs
  useEffect(() => {
    if (personalPlan) {
      router.replace('/(tabs)');
    }
  }, [personalPlan]);

  const handleGetPlan = () => {
    router.replace('/(tabs)');
  };

  // 1. GENERATING STATE
  if (planLoading || (!pendingPlan && !personalPlan)) {
    return (
      <View style={[styles.screen, styles.loadingScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[styles.page, styles.centerPage]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 24 }}>
            <View style={styles.iconBackground}>
              <HeartHandshakeLogo size={80} />
            </View>
          </Animated.View>
          <Text style={styles.title}>Designing your plan...</Text>
          <Text style={styles.subtitle}>
            Building your personalized wellness routine with custom behavioral safeguards based on your profile.
          </Text>
          {planError && <Text style={styles.errorText}>{planError}</Text>}
          <ActivityIndicator size="large" color={palette.teal} style={{ marginTop: 40 }} />
        </View>
      </View>
    );
  }

  // 2. READY STATE
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <View style={[pageStyles.pageColumn, styles.page]}>
        <View style={styles.hero}>
          <View style={styles.icon}>
            <HeartHandshakeLogo size={80} />
          </View>
          {isAuthenticated && user ? (
            <>
              <Text style={styles.title}>Welcome, {user.displayName || 'Healthee User'}!</Text>
              <Text style={styles.subtitle}>
                Your personalized wellness program is synced and ready.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Your plan is ready!</Text>
              <Text style={styles.subtitle}>
                Create an account to save your progress, or continue as a guest.
              </Text>
            </>
          )}
        </View>

        <View style={styles.actions}>
          {!isAuthenticated && (
            <Pressable
              style={[styles.buttonGoogle, authLoading && styles.buttonDisabled]}
              onPress={signInWithGoogle}
              disabled={authLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign up with Google">
              {authLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonGoogleText}>Sign up with Google</Text>
              )}
            </Pressable>
          )}
          <Pressable
            style={isAuthenticated ? styles.buttonGoogle : styles.buttonSecondary}
            onPress={handleGetPlan}
            disabled={authLoading}
            accessibilityRole="button"
            accessibilityLabel="Get your plan">
            <Text style={isAuthenticated ? styles.buttonGoogleText : styles.buttonSecondaryText}>
              Get your plan
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
    width: '100%',
  },
  loadingScreen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  centerPage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    backgroundColor: palette.sageLight,
    padding: 20,
    borderRadius: 100,
    ...cardShadow,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.slate,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: palette.slateMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actions: {
    gap: 12,
    width: '100%',
  },
  buttonGoogle: {
    backgroundColor: palette.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGoogleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonSecondary: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'transparent',
    width: '100%',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate,
  },
  errorText: {
    fontSize: 14,
    color: palette.high,
    marginTop: 16,
    textAlign: 'center',
  },
});
