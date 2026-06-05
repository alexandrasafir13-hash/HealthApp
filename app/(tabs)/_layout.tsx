import React, { useState, createContext } from 'react';
import { View, StyleSheet, Platform, Pressable, useWindowDimensions } from 'react-native';

export const LayoutContext = createContext<{
  headerTitle: string;
  setHeaderTitle: (t: string) => void;
  headerBackAction: (() => void) | null;
  setHeaderBackAction: (fn: (() => void) | null) => void;
}>({
  headerTitle: '',
  setHeaderTitle: () => {},
  headerBackAction: null,
  setHeaderBackAction: () => {},
});
import { Tabs, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PanelLeft, PanelRight, Plus, ChevronLeft } from 'lucide-react-native';

import ChatSidebar from '@/components/chat/ChatSidebar';
import RightPanel from '@/components/chat/RightPanel';
import DocumentRightPanel from '@/components/documents/DocumentRightPanel';
import { Text } from '@/components/Themed';
import { useChat } from '@/context/ChatContext';
import { useDocumentContext } from '@/context/DocumentContext';
import { palette, sidebarPalette } from '@/constants/theme';

const DESKTOP_BREAKPOINT = 900;

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [rightPanelOpen, setRightPanelOpen] = useState(isDesktop);

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);

  // Force width update to bypass Fast Refresh state caching
  React.useEffect(() => {
    setSidebarWidth(300);
  }, []);

  const [rightPanelWidth, setRightPanelWidth] = useState(0);
  const [isRightPanelDragging, setIsRightPanelDragging] = useState(false);

  const [headerTitle, setHeaderTitle] = useState('');
  const [headerBackAction, setHeaderBackAction] = useState<(() => void) | null>(null);

  const { activeSession, panelOutput, newSession } = useChat();
    const sessionTitle = activeSession?.title ?? `New Chat`;
  
  const { isPanelOpen: docPanelOpen, setPanelOpen: setDocPanelOpen } = useDocumentContext();
  
  const isDocRoute = pathname === '/documents';
  const isChatRoute = pathname === '/' || pathname === '/index';

  // The actual panel open state depends on the route
  const currentRightPanelOpen = isDocRoute ? docPanelOpen : rightPanelOpen;

  // Initialize right panel width to 30% of the screen by default
  React.useEffect(() => {
    if (width > 0 && rightPanelWidth === 0) {
      setRightPanelWidth(Math.round(width * 0.3));
    }
  }, [width, rightPanelWidth]);

  // Auto-show panel when there is panel output, hide when no active session
  React.useEffect(() => {
    if (panelOutput) {
      setRightPanelOpen(true);
    } else if (activeSession && isDesktop) {
      setRightPanelOpen(true);
    } else if (!activeSession) {
      setRightPanelOpen(false);
    }
  }, [panelOutput, activeSession?.id, isDesktop]);

  React.useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  // Close sidebar on mobile when navigating to another route
  React.useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  const handleSidebarMouseDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    setIsSidebarDragging(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent: any) => {
      const newWidth = Math.max(160, Math.min(400, startWidth + (moveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsSidebarDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleRightPanelMouseDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    setIsRightPanelDragging(true);
    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const onMouseMove = (moveEvent: any) => {
      // Dragging left increases the width, dragging right decreases it
      const newWidth = Math.max(250, Math.min(width * 0.8, startWidth - (moveEvent.clientX - startX)));
      setRightPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsRightPanelDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const sidebarAnim = useAnimatedStyle(() => {
    const targetWidth = sidebarOpen ? (isDesktop ? sidebarWidth : 280) : 0;
    return {
      width: isSidebarDragging
        ? targetWidth
        : withTiming(targetWidth, {
            duration: 180,
            easing: Easing.out(Easing.quad),
          }),
      overflow: 'hidden',
    };
  });

  return (
    <View style={styles.root}>
      {/* Mobile Sidebar Backdrop */}
      {!isDesktop && sidebarOpen && (
        <Pressable 
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 90 }}
          onPress={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Left sidebar ────────────────────── */}
      <Animated.View style={[
        sidebarAnim, 
        !isDesktop && { position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 100, backgroundColor: sidebarPalette.bg, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.06)' }
      ]}>
        <View style={{ width: '100%', height: '100%' }}>
          <ChatSidebar
            width={isDesktop ? sidebarWidth : 280}
            onToggleRightPanel={() => {
              if (isDocRoute) setDocPanelOpen(!docPanelOpen);
              else setRightPanelOpen((v) => !v);
              if (!isDesktop) setSidebarOpen(false); // Close sidebar after interaction on mobile
            }}
            rightPanelOpen={currentRightPanelOpen}
            onToggleSidebar={() => setSidebarOpen(false)}
          />
        </View>
      </Animated.View>

      {/* ── Left Sidebar Resizer divider (desktop only) ────────── */}
      {isDesktop && sidebarOpen && (
        <View
          style={[styles.resizer, { left: sidebarWidth - 3 }]}
          // @ts-ignore
          onMouseDown={handleSidebarMouseDown}
        >
          <View style={styles.resizerLine} />
        </View>
      )}

      {/* ── Main content column ────────────────────────────── */}
      <View style={styles.main}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 }}>
            {/* Left toggle */}
            <View style={{ width: 32, height: 32, justifyContent: 'center' }}>
              {!sidebarOpen && (
                <Pressable
                  style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
                  onPress={() => setSidebarOpen(true)}
                  id="toggle-sidebar-btn"
                >
                  <PanelLeft size={17} color={palette.slateMuted} />
                </Pressable>
              )}
            </View>

            {/* Center title & actions area */}
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
              <View style={{ width: '100%', maxWidth: 720, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {isChatRoute ? (
                  <View style={{ flex: 1 }} />
                ) : (
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    {headerBackAction && (
                      <Pressable 
                        onPress={headerBackAction} 
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
                      >
                        <ChevronLeft size={18} color={palette.teal} />
                        <Text style={{ color: palette.teal, fontSize: 15, fontWeight: '600', marginLeft: 2, fontFamily: 'Nunito_600SemiBold' }}>{`Back`}</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {isChatRoute ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {!isDesktop && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.generateBtn,
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={newSession}
                        id="top-new-chat-btn"
                      >
                        <Plus size={14} color={palette.slateMuted} />
                        <Text style={styles.generateLabel}>{`New Conversation`}</Text>
                      </Pressable>
                    )}

                    {activeSession && !rightPanelOpen && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => setRightPanelOpen(true)}
                        id="toggle-right-panel-btn"
                      >
                        <PanelRight
                          size={15}
                          color={palette.slateMuted}
                        />
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            </View>

            {/* Right spacer for perfect centering */}
            <View style={{ width: 32, height: 32 }} />
          </View>
        </View>

        {/* Tab screens fill the rest */}
        <View style={styles.screens}>
          <LayoutContext.Provider value={{ headerTitle, setHeaderTitle, headerBackAction, setHeaderBackAction }}>
            <Tabs
              tabBar={() => null}
              screenOptions={{ headerShown: false }}
            >
              <Tabs.Screen name="index" />
              <Tabs.Screen name="insights" />
              <Tabs.Screen name="profile" />
              <Tabs.Screen name="plan" />
              <Tabs.Screen name="sandbox" />
              <Tabs.Screen name="documents" />
              <Tabs.Screen name="providers" />
              <Tabs.Screen name="plans" />
              <Tabs.Screen name="timeline" />
            </Tabs>
          </LayoutContext.Provider>
        </View>
      </View>

      {/* ── Right Panel Resizer divider (desktop only) ───────── */}
      {isDesktop && currentRightPanelOpen && (
        <View
          style={[styles.resizer, { right: rightPanelWidth - 3 }]}
          // @ts-ignore
          onMouseDown={handleRightPanelMouseDown}
        >
          <View style={styles.resizerLine} />
        </View>
      )}

      {/* ── Right panel ─────────────────────── */}
      {activeSession && isChatRoute && (
        isDesktop ? (
          <RightPanel
            open={rightPanelOpen}
            width={rightPanelWidth}
            isDragging={isRightPanelDragging}
            onClose={() => setRightPanelOpen(false)}
          />
        ) : (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 200 }} pointerEvents={rightPanelOpen ? 'auto' : 'none'}>
            <RightPanel
              open={rightPanelOpen}
              width={width}
              isDragging={false}
              onClose={() => setRightPanelOpen(false)}
              isMobile={true}
            />
          </View>
        )
      )}

      {isDocRoute && (
        isDesktop ? (
          <DocumentRightPanel
            open={docPanelOpen}
            width={rightPanelWidth}
            isDragging={isRightPanelDragging}
            onClose={() => setDocPanelOpen(false)}
          />
        ) : (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 200 }} pointerEvents={docPanelOpen ? 'auto' : 'none'}>
            <DocumentRightPanel
              open={docPanelOpen}
              width={width}
              isDragging={false}
              onClose={() => setDocPanelOpen(false)}
            />
          </View>
        )
      )}
    </View>
  );
}

// ── Mobile bottom nav removed ─────────────────────────────────────────────────────────

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: palette.background,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: palette.background,
    overflow: 'hidden',
  },
  topBar: {
    backgroundColor: palette.background,
    width: '100%',
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.slateMuted,
    fontFamily: 'Nunito_600SemiBold',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  generateBtnActive: {
    backgroundColor: 'rgba(42,122,114,0.08)',
    borderColor: 'rgba(42,122,114,0.2)',
  },
  generateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slateMuted,
    fontFamily: 'Nunito_600SemiBold',
  },
  generateLabelActive: {
    color: palette.teal,
  },
  screens: {
    flex: 1,
  },
  resizer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'col-resize' } as any : {}),
  },
  resizerLine: {
    width: 1,
    height: '100%',
    backgroundColor: 'transparent', // removed solid line
  },
});
