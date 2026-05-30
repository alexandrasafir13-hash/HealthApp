import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { pageStyles } from '@/hooks/usePageLayout';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[pageStyles.scroll, styles.screen]}>
      <View
        style={[
          pageStyles.pageColumn,
          styles.page,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 },
        ]}>
      <View style={styles.hero}>
        <Image source={require('../assets/images/icon.png')} style={styles.icon} resizeMode="contain" />
        <Text style={styles.title}>Welcome to Healthy</Text>
      </View>

      <Pressable
        style={styles.guestButton}
        onPress={() => router.push('/onboarding')}
        accessibilityRole="button"
        accessibilityLabel="Continue as guest">
        <Text style={styles.guestButtonText}>Continue as guest</Text>
      </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
  },
  page: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  guestButton: {
    backgroundColor: palette.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
