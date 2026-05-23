import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { priorityHeartAmber } from '@/constants/theme';

/** Heart with a subtle pulse line for Today top priorities */
export default function PriorityHeartIcon() {
  return (
    <View style={styles.wrap}>
      <SymbolView
        name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
        tintColor={priorityHeartAmber}
        size={17}
      />
      <View style={styles.waveLine}>
        <SymbolView
          name={{ ios: 'waveform.path', android: 'show_chart', web: 'show_chart' }}
          tintColor={priorityHeartAmber}
          size={13}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLine: {
    position: 'absolute',
    bottom: 1,
    opacity: 0.88,
  },
});
