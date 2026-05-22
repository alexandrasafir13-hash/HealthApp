import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';

const SYMPTOMS = ['None', 'Fatigue', 'Headache', 'Sore throat', 'Congestion', 'Body aches'];

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}/5</Text>
      </View>
      <View style={styles.sliderTrack}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            style={[styles.sliderDot, n <= value && styles.sliderDotActive]}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
    </View>
  );
}

export default function CheckInForm() {
  const { todayCheckIn, saveCheckIn } = useHealth();
  const [energy, setEnergy] = useState(todayCheckIn?.energy ?? 3);
  const [sleepQuality, setSleepQuality] = useState(todayCheckIn?.sleepQuality ?? 3);
  const [stress, setStress] = useState(todayCheckIn?.stress ?? 3);
  const [symptoms, setSymptoms] = useState<string[]>(todayCheckIn?.symptoms ?? ['None']);
  const [saved, setSaved] = useState(!!todayCheckIn);

  const toggleSymptom = (s: string) => {
    if (s === 'None') {
      setSymptoms(['None']);
      return;
    }
    setSymptoms((prev) => {
      const without = prev.filter((x) => x !== 'None' && x !== s);
      if (prev.includes(s)) return without.length ? without : ['None'];
      return [...without, s];
    });
  };

  const handleSave = () => {
    saveCheckIn({ energy, sleepQuality, stress, symptoms });
    setSaved(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        A quick daily check-in helps the app connect how you feel with your wearable data.
      </Text>
      <SliderRow label="Energy" value={energy} onChange={setEnergy} />
      <SliderRow label="Sleep quality (last night)" value={sleepQuality} onChange={setSleepQuality} />
      <SliderRow label="Stress" value={stress} onChange={setStress} />
      <Text style={styles.symptomLabel}>Symptoms today</Text>
      <View style={styles.symptomRow}>
        {SYMPTOMS.map((s) => (
          <Pressable
            key={s}
            style={[styles.symptomChip, symptoms.includes(s) && styles.symptomChipActive]}
            onPress={() => toggleSymptom(s)}>
            <Text
              style={[
                styles.symptomChipText,
                symptoms.includes(s) && styles.symptomChipTextActive,
              ]}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{saved ? 'Update check-in' : 'Save check-in'}</Text>
      </Pressable>
      {saved && (
        <Text style={styles.savedNote}>
          Logged for today. Insights will weigh this alongside your connected devices.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginBottom: 16,
  },
  sliderBlock: {
    marginBottom: 18,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 14,
    color: palette.teal,
    fontWeight: '600',
  },
  sliderTrack: {
    flexDirection: 'row',
    gap: 10,
  },
  sliderDot: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.border,
  },
  sliderDotActive: {
    backgroundColor: palette.teal,
  },
  symptomLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 10,
  },
  symptomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  symptomChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  symptomChipActive: {
    backgroundColor: palette.sageLight,
    borderColor: palette.teal,
  },
  symptomChipText: {
    fontSize: 13,
    color: palette.slateMuted,
  },
  symptomChipTextActive: {
    color: palette.tealDark,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  savedNote: {
    fontSize: 13,
    textAlign: 'center',
    color: palette.slateSubtle,
    marginTop: 12,
  },
});
