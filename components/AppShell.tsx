import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/theme';
import { PAGE_MAX_WIDTH } from '@/hooks/useBreakpoint';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.outer}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
  },
});
