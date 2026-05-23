import { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import TwigIcon from '@/components/TwigIcon';
import { palette } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface Props {
  title: string;
  subtitle?: string;
  /** Softer weight for friendly headlines (e.g. Today) */
  friendly?: boolean;
  accessory?: ReactElement;
}

export default function PageTitle({ title, subtitle, friendly, accessory }: Props) {
  const { isTabletUp, isDesktop } = useBreakpoint();
  const twigSize = isDesktop ? 32 : isTabletUp ? 28 : 24;

  return (
    <View style={[styles.header, accessory != null && styles.headerWithAccessory]}>
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <View style={styles.twig}>
            <TwigIcon size={twigSize} />
          </View>
          <Text
            style={[
              styles.title,
              friendly && styles.titleFriendly,
              isTabletUp && styles.titleTablet,
              isDesktop && styles.titleDesktop,
            ]}
            maxFontSizeMultiplier={1.35}>
            {title}
          </Text>
        </View>
        {subtitle != null && (
          <Text
            style={[
              styles.subtitle,
              isTabletUp && styles.subtitleTablet,
              isDesktop && styles.subtitleDesktop,
            ]}
            maxFontSizeMultiplier={1.3}>
            {subtitle}
          </Text>
        )}
      </View>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  headerWithAccessory: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  twig: {
    marginTop: 4,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    color: palette.slate,
    letterSpacing: -0.3,
  },
  titleFriendly: {
    fontWeight: '700',
  },
  titleTablet: {
    fontSize: 26,
    lineHeight: 34,
  },
  titleDesktop: {
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
    marginTop: 8,
  },
  subtitleTablet: {
    fontSize: 15,
    lineHeight: 22,
  },
  subtitleDesktop: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
});
