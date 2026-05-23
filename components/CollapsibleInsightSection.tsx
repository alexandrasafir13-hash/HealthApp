import { SymbolView } from 'expo-symbols';
import { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { categoryAttentionColor, palette } from '@/constants/theme';

interface Props {
  title: string;
  color: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  compact?: boolean;
  needsAttention?: boolean;
  titleLeading?: ReactElement;
  hideBadge?: boolean;
}

export default function CollapsibleInsightSection({
  title,
  color,
  count,
  expanded,
  onToggle,
  children,
  compact,
  needsAttention,
  titleLeading,
  hideBadge,
}: Props) {
  const accentColor = needsAttention ? categoryAttentionColor : color;

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <Pressable
        style={({ pressed }) => [
          styles.header,
          compact && styles.headerCompact,
          needsAttention && styles.headerAttention,
          pressed && styles.headerPressed,
        ]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${count} insights, ${expanded ? 'expanded' : 'collapsed'}`}>
        <View style={styles.headerLeft}>
          {!needsAttention && (
            <View style={[styles.accent, { backgroundColor: accentColor }]} />
          )}
          {titleLeading}
          <Text style={[styles.title, needsAttention && styles.titleAttention, titleLeading && styles.titleWithLeading]}>
            {title}
          </Text>
          {!hideBadge && (
            <View style={[styles.badge, { backgroundColor: accentColor + '22' }]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>{count}</Text>
            </View>
          )}
        </View>
        <SymbolView
          name={{
            ios: expanded ? 'chevron.up' : 'chevron.down',
            android: expanded ? 'expand_less' : 'expand_more',
            web: expanded ? 'expand_less' : 'expand_more',
          }}
          tintColor={palette.slateMuted}
          size={22}
        />
      </Pressable>
      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  wrapperCompact: {
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerCompact: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerAttention: {
    borderColor: categoryAttentionColor + '55',
  },
  headerPressed: {
    opacity: 0.92,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  accent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.slate,
    flex: 1,
  },
  titleWithLeading: {
    flex: 1,
  },
  titleAttention: {
    color: categoryAttentionColor,
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    paddingTop: 12,
  },
});
