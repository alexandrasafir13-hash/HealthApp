import { Heart, Activity } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { priorityHeartAmber } from '@/constants/theme';

/** Heart with a subtle pulse line for Today top priorities */
export default function PriorityHeartIcon() {
  return (
    <View style={styles.wrap}>
      <Heart
        color={priorityHeartAmber}
        fill={priorityHeartAmber}
        size={17}
      />
      <View style={styles.waveLine}>
        <Activity
          color={priorityHeartAmber}
          size={11}
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
    bottom: 2,
    opacity: 0.88,
  },
});
