import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import CollapsibleInsightSection from '@/components/CollapsibleInsightSection';
import HabitListCard from '@/components/HabitListCard';
import { Text } from '@/components/Themed';
import { localDateKey } from '@/lib/localDate';
import { PRESET_SYMPTOMS, parseCustomSymptoms, splitSavedSymptoms } from '@/lib/symptoms';
import { palette } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';

const OTHER_REASON = 'Add a symptom not listed above';
const SYMPTOM_REASON = 'Tap to mark how you feel today';

interface Props {
  selectedDate: string;
}

export default function SymptomsSection({ selectedDate }: Props) {
  const { todayCheckIn, saveCheckIn, isReady } = useHealth();
  const isEditable = selectedDate === localDateKey();
  const savedSymptoms = todayCheckIn?.symptoms ?? ['None'];
  const initial = useMemo(() => splitSavedSymptoms(savedSymptoms), [savedSymptoms]);

  const [selected, setSelected] = useState<string[]>(
    initial.presets.length > 0 ? initial.presets : ['None'],
  );
  const [otherActive, setOtherActive] = useState(initial.custom.length > 0);
  const [otherText, setOtherText] = useState(initial.custom.join(', '));
  const [expanded, setExpanded] = useState(true);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!isReady || hydratedRef.current) return;
    hydratedRef.current = true;
    const split = splitSavedSymptoms(savedSymptoms);
    setSelected(split.presets.length > 0 ? split.presets : ['None']);
    setOtherActive(split.custom.length > 0);
    setOtherText(split.custom.join(', '));
  }, [isReady, savedSymptoms]);

  const customSymptoms = useMemo(() => parseCustomSymptoms(otherText), [otherText]);

  const activeCount = useMemo(() => {
    const presets = selected.filter((s) => s !== 'None');
    return presets.length + (otherActive ? customSymptoms.length : 0);
  }, [selected, otherActive, customSymptoms]);

  const buildSymptomsForSave = (nextSelected: string[], otherOn: boolean, otherRaw: string): string[] => {
    const presets = nextSelected.filter((s) => s !== 'None');
    const custom = otherOn ? parseCustomSymptoms(otherRaw) : [];
    const combined = [...presets, ...custom];
    return combined.length > 0 ? combined : ['None'];
  };

  const persist = (nextSelected: string[], otherOn = otherActive, otherRaw = otherText) => {
    if (!isEditable) return;
    saveCheckIn({ symptoms: buildSymptomsForSave(nextSelected, otherOn, otherRaw) });
  };

  const togglePreset = (symptom: string) => {
    if (symptom === 'None') {
      setSelected(['None']);
      setOtherActive(false);
      setOtherText('');
      persist(['None'], false, '');
      return;
    }

    setSelected((prev) => {
      const without = prev.filter((x) => x !== 'None' && x !== symptom);
      const next = prev.includes(symptom)
        ? without.length
          ? without
          : ['None']
        : [...without, symptom];
      persist(next);
      return next;
    });
  };

  const toggleOther = () => {
    setOtherActive((active) => {
      if (active) {
        setOtherText('');
        const presets = selected.filter((s) => s !== 'None');
        persist(presets.length ? presets : ['None'], false, '');
        return false;
      }
      setSelected((prev) => (prev.includes('None') ? [] : prev));
      return true;
    });
  };

  const handleOtherBlur = () => {
    persist(selected, true, otherText);
  };

  if (!isReady) return null;

  const noop = () => {};

  return (
    <CollapsibleInsightSection
      title="Symptoms (how are you feeling today?)"
      color={palette.teal}
      count={isEditable ? activeCount : 0}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      hideBadge={!isEditable || activeCount === 0}>
      <View style={styles.panel}>
        <Text style={styles.hint}>
          {isEditable
            ? 'Mark any symptoms you feel today — same as checking off a habit.'
            : 'Symptoms can only be logged for today. Switch to today to update how you feel.'}
        </Text>

        {PRESET_SYMPTOMS.map((symptom) => (
          <HabitListCard
            key={symptom}
            title={symptom}
            reason={SYMPTOM_REASON}
            completed={isEditable && selected.includes(symptom)}
            onPress={isEditable ? () => togglePreset(symptom) : noop}
          />
        ))}

        <HabitListCard
          title="Other"
          reason={OTHER_REASON}
          completed={isEditable && otherActive}
          onPress={isEditable ? toggleOther : noop}
        />

        {isEditable && otherActive && (
          <View style={styles.otherEditor}>
            <TextInput
              style={styles.otherInput}
              placeholder="e.g. dizziness, nausea, jaw pain"
              placeholderTextColor={palette.slateSubtle}
              value={otherText}
              onChangeText={(text) => {
                setOtherText(text);
                if (text.trim()) {
                  setSelected((prev) => prev.filter((x) => x !== 'None'));
                }
              }}
              onBlur={handleOtherBlur}
              multiline
              maxLength={200}
              accessibilityLabel="Other symptoms"
            />
            <Text style={styles.otherHint}>Separate multiple symptoms with commas.</Text>
            {customSymptoms.map((symptom) => (
              <HabitListCard
                key={symptom}
                title={symptom}
                reason="From your custom list"
                completed
                onPress={() => {
                  const nextText = customSymptoms.filter((s) => s !== symptom).join(', ');
                  setOtherText(nextText);
                  persist(selected, nextText.length > 0, nextText);
                  if (!nextText) setOtherActive(false);
                }}
              />
            ))}
          </View>
        )}
      </View>
    </CollapsibleInsightSection>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 0,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.slateMuted,
    marginBottom: 12,
  },
  otherEditor: {
    gap: 8,
    marginBottom: 4,
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
    marginBottom: 4,
  },
});
