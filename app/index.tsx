import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useHealth } from '@/context/HealthContext';

export default function Index() {
  const { isReady, onboardingComplete, isRestoring } = useHealth();

  // Wait for local storage to load and any cloud restore to complete before routing
  if (!isReady || isRestoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
