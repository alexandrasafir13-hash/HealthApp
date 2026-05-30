import { Dimensions, Platform, useWindowDimensions } from 'react-native';

export const PAGE_MAX_WIDTH = 720;

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

/** useWindowDimensions() is 0 on the first web paint; read sync sources to avoid a full-width flash. */
function getStableWindowWidth(hookWidth: number): number {
  if (hookWidth > 0) return hookWidth;

  const fromDimensions = Dimensions.get('window').width;
  if (fromDimensions > 0) return fromDimensions;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.innerWidth;
  }

  return hookWidth;
}

export function useBreakpoint() {
  const { width: hookWidth } = useWindowDimensions();
  const width = getStableWindowWidth(hookWidth);
  const isTabletUp = width >= TABLET_MIN;
  const isDesktop = width >= DESKTOP_MIN;
  const pageMaxWidth = isTabletUp ? PAGE_MAX_WIDTH : undefined;

  return { width, isTabletUp, isDesktop, pageMaxWidth };
}
