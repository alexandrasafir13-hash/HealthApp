import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import HabitListCard from '@/components/HabitListCard';
import TodaySelectChip from '@/components/TodaySelectChip';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { PRESET_SYMPTOMS, parseCustomSymptoms, splitSavedSymptoms } from '@/lib/symptoms';
import { palette } from '@/constants/theme';

const OTHER_REASON = 'Add a symptom not listed above';
const SYMPTOM_REASON = 'Tap if you have this today';

interface Props {
  /** Preset list includes "None"; pass false to hide it on Today */
  showNoneOption?: boolean;
  /** Compact chips in one row (Today). Default list cards (Routine). */
  layout?: 'list' | 'row';
  /** Today screen: edit draft only until Submit. */
  draftOnly?: boolean;
}

export default function SymptomsPicker({
  showNoneOption = true,
  layout = 'list',
  draftOnly = false,
}: Props) {
  const { todayCheckIn, todaySymptoms, updateTodayDraft, saveCheckIn, isReady } = useHealth();
  const savedSymptoms = draftOnly ? todaySymptoms : (todayCheckIn?.symptoms ?? ['None']);
  const initial = useMemo(() => splitSavedSymptoms(savedSymptoms), [savedSymptoms]);

  const [selected, setSelected] = useState<string[]>(
    initial.presets.length > 0 ? initial.presets : ['None'],
  );
  const [otherActive, setOtherActive] = useState(initial.custom.length > 0);
  const [otherText, setOtherText] = useState(initial.custom.join(', '));
  const hydratedRef = useRef(false);

  const presets = showNoneOption
    ? PRESET_SYMPTOMS
    : PRESET_SYMPTOMS.filter((s) => s !== 'None');

  useEffect(() => {
    if (!isReady) return;
    const split = splitSavedSymptoms(savedSymptoms);
    if (!hydratedRef.current) {
      hydratedRef.current = true;
    }
    setSelected(split.presets.length > 0 ? split.presets : ['None']);
    setOtherActive(split.custom.length > 0);
    setOtherText(split.custom.join(', '));
  }, [isReady, savedSymptoms, draftOnly]);

  const customSymptoms = useMemo(() => parseCustomSymptoms(otherText), [otherText]);

  const buildSymptomsForSave = (nextSelected: string[], otherOn: boolean, otherRaw: string): string[] => {
    const presetChoices = nextSelected.filter((s) => s !== 'None');
    const custom = otherOn ? parseCustomSymptoms(otherRaw) : [];
    const combined = [...presetChoices, ...custom];
    return combined.length > 0 ? combined : ['None'];
  };

  const persist = (nextSelected: string[], otherOn = otherActive, otherRaw = otherText) => {
    const symptoms = buildSymptomsForSave(nextSelected, otherOn, otherRaw);
    if (draftOnly) {
      updateTodayDraft({ symptoms });
    } else {
      saveCheckIn({ symptoms });
    }
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
        const presetChoices = selected.filter((s) => s !== 'None');
        persist(presetChoices.length ? presetChoices : ['None'], false, '');
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

  const chipRow = layout === 'row';

  return (
    <View style={styles.panel}>
      <View style={chipRow ? styles.row : undefined}>
        {presets.map((symptom) =>
          chipRow ? (
            <TodaySelectChip
              key={symptom}
              label={symptom}
              selected={selected.includes(symptom)}
              onPress={() => togglePreset(symptom)}
            />
          ) : (
            <HabitListCard
              key={symptom}
              title={symptom}
              reason={SYMPTOM_REASON}
              completed={selected.includes(symptom)}
              onPress={() => togglePreset(symptom)}
            />
          ),
        )}
        {chipRow ? (
          <TodaySelectChip label="Other" selected={otherActive} onPress={toggleOther} />
        ) : (
          <HabitListCard
            title="Other"
            reason={OTHER_REASON}
            completed={otherActive}
            onPress={toggleOther}
          />
        )}
      </View>

      {otherActive && (
        <View style={styles.otherEditor}>
          <TextInput
            style={styles.otherInput}
            placeholder="e.g. dizziness, nausea"
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
          <Text style={styles.otherHint}>Separate multiple with commas.</Text>
          {customSymptoms.length > 0 && (
            <View style={chipRow ? styles.row : undefined}>
              {customSymptoms.map((symptom) =>
                chipRow ? (
                  <TodaySelectChip
                    key={symptom}
                    label={symptom}
                    selected
                    onPress={() => {
                      const nextText = customSymptoms.filter((s) => s !== symptom).join(', ');
                      setOtherText(nextText);
                      persist(selected, nextText.length > 0, nextText);
                      if (!nextText) setOtherActive(false);
                    }}
                  />
                ) : (
                  <HabitListCard
                    key={symptom}
                    title={symptom}
                    reason="From your list"
                    completed
                    onPress={() => {
                      const nextText = customSymptoms.filter((s) => s !== symptom).join(', ');
                      setOtherText(nextText);
                      persist(selected, nextText.length > 0, nextText);
                      if (!nextText) setOtherActive(false);
                    }}
                  />
                ),
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    justifyContent: 'flex-start',
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
