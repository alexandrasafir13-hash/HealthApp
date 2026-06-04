import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';
import { PAGE_MAX_WIDTH, useBreakpoint } from '@/hooks/useBreakpoint';

export function usePageLayout() {
  const insets = useSafeAreaInsets();
  const { isTabletUp, isDesktop } = useBreakpoint();

  // Dynamically calculate bottom padding to clear the floating mobile tab bar (height 72 + margin + safety)
  const bottomPadding = isDesktop
    ? (isTabletUp ? 48 : 32)
    : Math.max(insets.bottom, 16) + 72 + 16;

  return {
    isTabletUp,
    isDesktop,
    contentContainerStyle: [
      pageStyles.content,
      isTabletUp && pageStyles.contentTablet,
      { 
        paddingTop: insets.top + (isTabletUp ? 24 : 8),
        paddingBottom: bottomPadding,
      },
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
