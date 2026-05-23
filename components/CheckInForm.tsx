import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import CheckInMetricRow from '@/components/CheckInMetricRow';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';

const PRESET_SYMPTOMS = ['None', 'Fatigue', 'Headache', 'Sore throat', 'Congestion', 'Body aches'];

function parseCustomSymptoms(text: string): string[] {
  return text
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitSavedSymptoms(all: string[]) {
  const presets = all.filter((s) => (PRESET_SYMPTOMS as readonly string[]).includes(s));
  const custom = all.filter((s) => !(PRESET_SYMPTOMS as readonly string[]).includes(s));
  return { presets, custom };
}

export default function CheckInForm() {
  const { todayCheckIn, saveCheckIn } = useHealth();
  const initial = useMemo(
    () => splitSavedSymptoms(todayCheckIn?.symptoms ?? ['None']),
    [todayCheckIn?.symptoms]
  );

  const [energy, setEnergy] = useState(todayCheckIn?.energy ?? 3);
  const [sleepQuality, setSleepQuality] = useState(todayCheckIn?.sleepQuality ?? 3);
  const [stress, setStress] = useState(todayCheckIn?.stress ?? 3);
  const [symptoms, setSymptoms] = useState<string[]>(
    initial.presets.length > 0 ? initial.presets : ['None']
  );
  const [otherActive, setOtherActive] = useState(initial.custom.length > 0);
  const [otherText, setOtherText] = useState(initial.custom.join(', '));
  const [saved, setSaved] = useState(!!todayCheckIn);

  const customSymptoms = useMemo(() => parseCustomSymptoms(otherText), [otherText]);

  const toggleSymptom = (s: string) => {
    if (s === 'None') {
      setSymptoms(['None']);
      setOtherActive(false);
      setOtherText('');
      return;
    }
    setSymptoms((prev) => {
      const without = prev.filter((x) => x !== 'None' && x !== s);
      if (prev.includes(s)) return without.length ? without : ['None'];
      return [...without, s];
    });
  };

  const toggleOther = () => {
    setOtherActive((active) => {
      if (active) {
        setOtherText('');
        return false;
      }
      setSymptoms((prev) => (prev.includes('None') ? [] : prev));
      return true;
    });
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (text.trim()) {
      setSymptoms((prev) => prev.filter((x) => x !== 'None'));
    }
  };

  const buildSymptomsForSave = (): string[] => {
    const presets = symptoms.filter((s) => s !== 'None');
    const combined = [...presets, ...(otherActive ? customSymptoms : [])];
    return combined.length > 0 ? combined : ['None'];
  };

  const handleSave = () => {
    saveCheckIn({ energy, sleepQuality, stress, symptoms: buildSymptomsForSave() });
    setSaved(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        A quick daily check-in helps the app connect how you feel with your wearable data.
      </Text>

      <CheckInMetricRow label="Energy" value={energy} onChange={setEnergy} />
      <CheckInMetricRow
        label="Sleep quality (last night)"
        value={sleepQuality}
        onChange={setSleepQuality}
      />
      <CheckInMetricRow label="Stress" value={stress} onChange={setStress} lowerIsBetter />

      <Text style={styles.symptomLabel}>Symptoms today</Text>
      <View style={styles.symptomRow}>
        {PRESET_SYMPTOMS.map((s) => (
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
        <Pressable
          style={[styles.symptomChip, otherActive && styles.symptomChipActive]}
          onPress={toggleOther}
          accessibilityRole="button"
          accessibilityState={{ selected: otherActive }}>
          <Text style={[styles.symptomChipText, otherActive && styles.symptomChipTextActive]}>
            Other
          </Text>
        </Pressable>
      </View>

      {otherActive && (
        <View style={styles.otherEditor}>
          <TextInput
            style={styles.otherInput}
            placeholder="e.g. dizziness, nausea, jaw pain"
            placeholderTextColor={palette.slateSubtle}
            value={otherText}
            onChangeText={handleOtherTextChange}
            multiline
            maxLength={200}
            accessibilityLabel="Other symptoms"
          />
          <Text style={styles.otherHint}>Separate multiple symptoms with commas.</Text>
          {customSymptoms.length > 0 && (
            <View style={styles.customPreview}>
              {customSymptoms.map((s) => (
                <View key={s} style={styles.customChip}>
                  <Text style={styles.customChipText}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

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
  symptomLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 10,
    color: palette.slate,
  },
  symptomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  otherEditor: {
    marginBottom: 20,
    gap: 8,
  },
  otherInput: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: palette.slate,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  otherHint: {
    fontSize: 12,
    color: palette.slateSubtle,
  },
  customPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: palette.sageLight,
    borderWidth: 1,
    borderColor: palette.teal,
  },
  customChipText: {
    fontSize: 13,
    color: palette.tealDark,
    fontWeight: '600',
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
