import { useWindowDimensions } from 'react-native';

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isTabletUp = width >= TABLET_MIN;
  const isDesktop = width >= DESKTOP_MIN;
  const pageMaxWidth = isDesktop ? 1040 : isTabletUp ? 720 : undefined;

  return { width, isTabletUp, isDesktop, pageMaxWidth };
}
