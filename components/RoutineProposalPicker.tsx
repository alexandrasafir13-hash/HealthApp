import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { palette } from '@/constants/theme';
import { PAGE_MAX_WIDTH, useBreakpoint } from '@/hooks/useBreakpoint';
import { actionDoneWhen } from '@/types/routine';
import { RoutineOption } from '@/types/routine';

type Props = {
  options: RoutineOption[];
  onSelect: (optionId: string) => void;
  error: string | null;
};

const ARROW_WIDTH = 36;
const CARD_GAP = 12;
const CARD_WIDTH_RATIO = 0.78;
const SCROLL_SETTLE_MS = Platform.OS === 'web' ? 80 : 120;

const webSnapListStyle =
  Platform.OS === 'web'
    ? ({
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      } as ViewStyle)
    : undefined;

const webSnapPageStyle =
  Platform.OS === 'web'
    ? ({
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
      } as ViewStyle)
    : undefined;

export default function RoutineProposalPicker({ options, onSelect, error }: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isTabletUp } = useBreakpoint();
  const outerPadding = isTabletUp ? 32 : 20;
  const columnWidth = Math.min(windowWidth - outerPadding * 2, PAGE_MAX_WIDTH);
  const showArrows = isTabletUp || Platform.OS === 'web';
  const estimatedTrackWidth = Math.max(
    columnWidth - (showArrows ? ARROW_WIDTH * 2 : 0),
    240,
  );
  const maxCardHeight = Math.min(windowHeight * 0.58, 520);

  const listRef = useRef<FlatList<RoutineOption>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackWidth, setTrackWidth] = useState(estimatedTrackWidth);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnapping = useRef(false);
  const lastOffsetX = useRef(0);

  const layout = useMemo(() => {
    const track = trackWidth > 0 ? trackWidth : estimatedTrackWidth;
    const cardWidth = Math.round(track * CARD_WIDTH_RATIO);
    const sideInset = Math.round((track - cardWidth) / 2);
    const itemStride = cardWidth + CARD_GAP;
    return { track, cardWidth, sideInset, itemStride };
  }, [trackWidth, estimatedTrackWidth]);

  const snapToOffsets = useMemo(
    () => options.map((_, index) => index * layout.itemStride),
    [options, layout.itemStride],
  );

  const finishScroll = useCallback(
    (offsetX: number) => {
      const index = Math.round(offsetX / layout.itemStride);
      const clamped = Math.min(Math.max(index, 0), options.length - 1);
      const target = clamped * layout.itemStride;

      setActiveIndex(clamped);

      if (Math.abs(offsetX - target) <= 1) return;

      isSnapping.current = true;
      listRef.current?.scrollToOffset({ offset: target, animated: true });
      setTimeout(() => {
        isSnapping.current = false;
      }, 280);
    },
    [layout.itemStride, options.length],
  );

  const scheduleSnap = useCallback(
    (offsetX: number) => {
      lastOffsetX.current = offsetX;
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
      scrollEndTimer.current = setTimeout(() => {
        if (!isSnapping.current) {
          finishScroll(lastOffsetX.current);
        }
      }, SCROLL_SETTLE_MS);
    },
    [finishScroll],
  );

  useEffect(
    () => () => {
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    },
    [],
  );

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSnapping.current) return;
    scheduleSnap(event.nativeEvent.contentOffset.x);
  };

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= options.length) return;
    const target = index * layout.itemStride;
    listRef.current?.scrollToOffset({ offset: target, animated: true });
    setActiveIndex(index);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    finishScroll(event.nativeEvent.contentOffset.x);
  };

  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < options.length - 1;

  return (
    <View style={[styles.container, { maxWidth: PAGE_MAX_WIDTH }]}>
      <Text style={styles.sectionTitle}>Pick your starter routine</Text>
      <Text style={styles.subtitle}>
        {showArrows
          ? 'Swipe or use the arrows — then choose the one that fits best.'
          : 'Swipe to compare — then choose the one that fits best.'}
      </Text>

      <View style={styles.carouselRow}>
        {showArrows && (
          <Pressable
            style={[styles.arrowButton, !canGoBack && styles.arrowButtonDisabled]}
            onPress={() => scrollToIndex(activeIndex - 1)}
            disabled={!canGoBack}
            accessibilityRole="button"
            accessibilityLabel="Previous routine option">
            <ChevronLeft color={canGoBack ? palette.slate : palette.slateSubtle} size={28} />
          </Pressable>
        )}

        <FlatList
          ref={listRef}
          data={options}
          keyExtractor={(item) => item.id}
          horizontal
          clipToPadding={false}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToOffsets={snapToOffsets}
          snapToAlignment="start"
          overScrollMode="never"
          scrollEventThrottle={16}
          onScroll={onScroll}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
          style={[styles.list, webSnapListStyle]}
          contentContainerStyle={{ paddingHorizontal: layout.sideInset }}
          renderItem={({ item, index }) => {
            const isActive = index === activeIndex;
            return (
              <View
                style={[
                  styles.page,
                  webSnapPageStyle,
                  { width: layout.itemStride, height: maxCardHeight + 16 },
                ]}>
                <View
                  style={[
                    styles.optionCard,
                    {
                      width: layout.cardWidth,
                      height: maxCardHeight,
                      opacity: isActive ? 1 : 0.72,
                    },
                  ]}>
                  <ScrollView
                    style={styles.cardScroll}
                    contentContainerStyle={styles.cardScrollContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    directionalLockEnabled
                    scrollEnabled={isActive}
                    keyboardShouldPersistTaps="handled">
                    <Text style={styles.optionLabel}>Option {index + 1} of {options.length}</Text>
                    <Text style={styles.routineTitle}>{item.title}</Text>
                    <Text style={styles.focusLabel}>Focus: {item.primaryGoalTitle}</Text>
                    <Text style={styles.body}>{item.whyThisGoal}</Text>
                    <Text style={styles.intro}>{item.intro}</Text>

                    {item.overviewTips.length > 0 && (
                      <>
                        <Text style={styles.sectionLabel}>Overview</Text>
                        {item.overviewTips.map((tip, tipIndex) => (
                          <View key={`${item.id}-tip-${tipIndex}`} style={styles.tipRow}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>{tip}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    <Text style={styles.sectionLabel}>Daily checklist</Text>
                    {item.dailyActions.map((action, actionIndex) => (
                      <View key={`${item.id}-action-${actionIndex}`} style={styles.actionRow}>
                        <View style={styles.actionCheckbox}>
                          <Text style={styles.actionCheckboxMark}> </Text>
                        </View>
                        <View style={styles.actionContent}>
                          <Text style={styles.actionTitle}>{action.title}</Text>
                          <Text style={styles.actionMeta}>
                            {action.timeHint} · Done when: {actionDoneWhen(action)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  <Pressable
                    style={styles.chooseButton}
                    onPress={() => onSelect(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${item.title} for ${item.primaryGoalTitle}`}>
                    <Text style={styles.chooseButtonText}>Choose this one</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />

        {showArrows && (
          <Pressable
            style={[styles.arrowButton, !canGoForward && styles.arrowButtonDisabled]}
            onPress={() => scrollToIndex(activeIndex + 1)}
            disabled={!canGoForward}
            accessibilityRole="button"
            accessibilityLabel="Next routine option">
            <ChevronRight color={canGoForward ? palette.slate : palette.slateSubtle} size={28} />
          </Pressable>
        )}
      </View>

      <View style={styles.dots}>
        {options.map((option, index) => (
          <Pressable
            key={option.id}
            onPress={() => scrollToIndex(index)}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
            accessibilityRole="button"
            accessibilityLabel={`Go to routine option ${index + 1}`}
          />
        ))}
      </View>

      {error != null && <Text style={styles.note}>{error}</Text>}
      <Text style={styles.disclaimer}>Not medical advice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.slate,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.slateMuted,
  },
  carouselRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  arrowButton: {
    width: ARROW_WIDTH,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.35,
  },
  list: {
    flex: 1,
  },
  page: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  optionCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    gap: 10,
    paddingBottom: 4,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slateSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  focusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.teal,
  },
  routineTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.slate,
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateMuted,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slate,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slate,
    marginTop: 4,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slateSubtle,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: palette.background,
    borderRadius: 10,
    padding: 10,
  },
  actionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.teal,
    marginTop: 2,
  },
  actionCheckboxMark: {
    fontSize: 1,
    color: 'transparent',
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate,
  },
  actionMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.slateMuted,
  },
  chooseButton: {
    marginTop: 12,
    backgroundColor: palette.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chooseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.border,
  },
  dotActive: {
    backgroundColor: palette.teal,
    width: 20,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateSubtle,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: palette.slateSubtle,
    textAlign: 'center',
  },
});
