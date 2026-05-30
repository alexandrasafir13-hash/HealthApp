import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';
import { PAGE_MAX_WIDTH, useBreakpoint } from '@/hooks/useBreakpoint';

export function usePageLayout() {
  const insets = useSafeAreaInsets();
  const { isTabletUp, isDesktop } = useBreakpoint();

  return {
    isTabletUp,
    isDesktop,
    contentContainerStyle: [
      pageStyles.content,
      isTabletUp && pageStyles.contentTablet,
      { paddingTop: insets.top + (isTabletUp ? 24 : 8) },
    ],
    pageStyle: pageStyles.page,
  };
}

export const pageStyles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
    backgroundColor: palette.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  contentTablet: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  page: {
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
  },
  pageColumn: {
    flex: 1,
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
});
