import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CollapsibleInsightSection from '@/components/CollapsibleInsightSection';
import SymptomsPicker from '@/components/SymptomsPicker';
import { Text } from '@/components/Themed';
import { localDateKey } from '@/lib/localDate';
import { splitSavedSymptoms } from '@/lib/symptoms';
import { palette } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';

interface Props {
  selectedDate: string;
}

export default function SymptomsSection({ selectedDate }: Props) {
  const { todayCheckIn, isReady } = useHealth();
  const isEditable = selectedDate === localDateKey();
  const savedSymptoms = todayCheckIn?.symptoms ?? ['None'];
  const [expanded, setExpanded] = useState(true);

  const activeCount = useMemo(() => {
    const split = splitSavedSymptoms(savedSymptoms);
    const presets = split.presets.filter((s) => s !== 'None');
    return presets.length + split.custom.length;
  }, [savedSymptoms]);

  if (!isReady) return null;

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
        {isEditable ? <SymptomsPicker /> : null}
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
});
