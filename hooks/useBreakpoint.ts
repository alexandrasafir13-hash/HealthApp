import { useWindowDimensions } from 'react-native';

export const PAGE_MAX_WIDTH = 720;

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isTabletUp = width >= TABLET_MIN;
  const isDesktop = width >= DESKTOP_MIN;

  return { width, isTabletUp, isDesktop };
}
