import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { leafGreen } from '@/constants/theme';

const TWIG_COLOR = '#8A9B7A';

interface Props {
  size?: number;
}

/** Small twig with two leaves for page titles */
export default function TwigIcon({ size = 26 }: Props) {
  const leafSize = Math.round(size * 0.52);
  const stemHeight = Math.round(size * 0.72);
  const stemWidth = Math.max(2, Math.round(size * 0.1));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.stem,
          {
            width: stemWidth,
            height: stemHeight,
            borderRadius: stemWidth / 2,
          },
        ]}
      />
      <View style={[styles.leafWrap, styles.leafLeft, { top: size * 0.02, left: size * 0.02 }]}>
        <View style={styles.leafRotateLeft}>
          <SymbolView
            name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }}
            tintColor={leafGreen}
            size={leafSize}
          />
        </View>
      </View>
      <View style={[styles.leafWrap, styles.leafRight, { top: size * 0.02, right: size * 0.02 }]}>
        <View style={styles.leafRotateRight}>
          <SymbolView
            name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }}
            tintColor={leafGreen}
            size={leafSize}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stem: {
    backgroundColor: TWIG_COLOR,
    marginBottom: 1,
  },
  leafWrap: {
    position: 'absolute',
  },
  leafLeft: {},
  leafRight: {},
  leafRotateLeft: {
    transform: [{ rotate: '-42deg' }],
  },
  leafRotateRight: {
    transform: [{ rotate: '42deg' }],
  },
});
