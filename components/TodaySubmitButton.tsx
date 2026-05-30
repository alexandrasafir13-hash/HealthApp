import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { palette } from '@/constants/theme';

export default function TodaySubmitButton() {
  const { todayFeeling, todayCheckIn, todayCheckInSaved, submitTodayCheckIn } = useHealth();
  const [busy, setBusy] = useState(false);

  if (todayFeeling == null) return null;

  const label = busy
    ? 'Saving…'
    : todayCheckInSaved
      ? 'Saved for today'
      : todayCheckIn != null
        ? 'Update check-in'
        : 'Save check-in';

  const handlePress = async () => {
    if (busy || todayCheckInSaved) return;
    setBusy(true);
    try {
      await submitTodayCheckIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          todayCheckInSaved && styles.buttonSaved,
          pressed && !todayCheckInSaved && !busy && styles.buttonPressed,
        ]}
        onPress={handlePress}
        disabled={busy || todayCheckInSaved}
        accessibilityRole="button"
        accessibilityLabel={label}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>Saves your check-in and loads personalized insights.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 28,
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
  buttonSaved: {
    backgroundColor: palette.sage,
    opacity: 0.85,
  },
  buttonPressed: {
    opacity: 0.88,
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
    textAlign: 'left',
  },
});
