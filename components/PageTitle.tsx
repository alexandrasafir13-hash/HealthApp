import { ReactElement, useCallback, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { LayoutContext } from '@/app/(tabs)/_layout';

interface Props {
  title: string;
  subtitle?: string;
  /** Softer weight for friendly headlines (e.g. Today) */
  friendly?: boolean;
  accessory?: ReactElement;
  onBack?: () => void;
}

export default function PageTitle({ title, subtitle, friendly, accessory, onBack }: Props) {
  const { isTabletUp, isDesktop } = useBreakpoint();
  const { setHeaderTitle, setHeaderBackAction } = useContext(LayoutContext);

  useFocusEffect(
    useCallback(() => {
      setHeaderTitle(title);
      setHeaderBackAction(() => onBack || null);
      
      return () => {
        // Optional cleanup
      };
    }, [title, setHeaderTitle, setHeaderBackAction, onBack])
  );

  return (
    <View style={[styles.header, accessory != null && styles.headerWithAccessory, { marginBottom: 12 }]}>
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              friendly && styles.titleFriendly,
              isTabletUp && styles.titleTablet,
              isDesktop && styles.titleDesktop,
            ]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}>
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
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
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
    fontSize: 15,
    lineHeight: 22,
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
