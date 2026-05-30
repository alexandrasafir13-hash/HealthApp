import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { localDateKey } from '@/lib/localDate';
import { palette } from '@/constants/theme';

interface Props {
  selectedDate: string;
}

export default function RoutineUpdateButton({ selectedDate }: Props) {
  const router = useRouter();
  const { syncRoutineCheckIn, hasRoutineCheckInData, isReady } = useHealth();
  const [busy, setBusy] = useState(false);

  const todayKey = localDateKey();
  const isToday = selectedDate === todayKey;
  const canUpdate = isReady && isToday && hasRoutineCheckInData(selectedDate);

  const handlePress = async () => {
    if (!canUpdate || busy) return;
    setBusy(true);
    try {
      const checkIn = await syncRoutineCheckIn(selectedDate);
      if (checkIn) {
        router.push('/(tabs)');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          !canUpdate && styles.buttonDisabled,
          pressed && canUpdate && !busy && styles.buttonPressed,
        ]}
        onPress={handlePress}
        disabled={!canUpdate || busy}
        accessibilityRole="button"
        accessibilityLabel="Update Listening to your body with today's routine">
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>
        {isToday
          ? 'Send today\u2019s habits and symptoms to Listening to your body.'
          : 'Select today to update Listening to your body.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    marginBottom: 8,
    gap: 10,
  },
  button: {
    backgroundColor: palette.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
    textAlign: 'center',
  },
});
