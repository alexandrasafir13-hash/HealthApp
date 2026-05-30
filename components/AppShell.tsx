import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/theme';

/** Full-width shell; content width is capped in usePageLayout, not here. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: palette.background,
  },
});
