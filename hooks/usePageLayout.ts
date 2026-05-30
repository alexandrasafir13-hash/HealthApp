import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export function usePageLayout() {
  const insets = useSafeAreaInsets();
  const { isTabletUp, isDesktop, pageMaxWidth } = useBreakpoint();

  return {
    isTabletUp,
    isDesktop,
    contentContainerStyle: [
      pageStyles.content,
      isTabletUp && pageStyles.contentTablet,
      { paddingTop: insets.top + (isTabletUp ? 24 : 8) },
    ],
    pageStyle: [
      pageStyles.page,
      pageMaxWidth != null && { maxWidth: pageMaxWidth, width: '100%' as const },
    ],
  };
}

export const pageStyles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  contentTablet: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  page: {
    width: '100%',
  },
});
