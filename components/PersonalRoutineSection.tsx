import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import PersonalRoutineCard from '@/components/PersonalRoutineCard';
import RoutineProposalPicker from '@/components/RoutineProposalPicker';
import { palette } from '@/constants/theme';
import { PAGE_MAX_WIDTH } from '@/hooks/useBreakpoint';
import { PersonalRoutine, RoutineProposalSet } from '@/types/routine';

type Props = {
  personalRoutine: PersonalRoutine | null;
  routineProposals: RoutineProposalSet | null;
  isLoading: boolean;
  error: string | null;
  onSelectRoutine: (optionId: string) => void;
  choosingMode?: boolean;
};

export default function PersonalRoutineSection({
  personalRoutine,
  routineProposals,
  isLoading,
  error,
  onSelectRoutine,
  choosingMode = false,
}: Props) {
  if (isLoading && !routineProposals && !personalRoutine) {
    return (
      <View style={[styles.loadingWrap, choosingMode && styles.loadingWrapFull]}>
        <View style={[styles.card, choosingMode && styles.cardConstrained]}>
          <Text style={styles.sectionTitle}>Your starter routine</Text>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.sage} />
            <Text style={styles.body}>Building three routine options for you…</Text>
          </View>
        </View>
      </View>
    );
  }

  if (personalRoutine) {
    return <PersonalRoutineCard routine={personalRoutine} error={error} />;
  }

  if (routineProposals && routineProposals.options.length > 0) {
    return (
      <RoutineProposalPicker
        options={routineProposals.options}
        onSelect={onSelectRoutine}
        error={error}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingWrap: {
    width: '100%',
  },
  loadingWrapFull: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 10,
    width: '100%',
  },
  cardConstrained: {
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.slate,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
