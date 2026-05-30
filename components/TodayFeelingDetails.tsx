import { StyleSheet, View } from 'react-native';

import SymptomsPicker from '@/components/SymptomsPicker';
import { Text } from '@/components/Themed';
import { feelingFollowUp } from '@/lib/feelingFollowUp';
import { palette } from '@/constants/theme';

interface Props {
  feelingValue: number;
}

export default function TodayFeelingDetails({ feelingValue }: Props) {
  const followUp = feelingFollowUp(feelingValue);

  if (!followUp.showSymptoms) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{followUp.symptomsTitle}</Text>
      <SymptomsPicker
        showNoneOption={followUp.symptomsShowNone}
        layout="row"
        draftOnly
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 28,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.slate,
  },
});
