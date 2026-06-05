import { useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useChat } from '@/context/ChatContext';
import { useHealth } from '@/context/HealthContext';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import PanelContent from '@/components/chat/PanelContent';
import { palette } from '@/constants/theme';
import HeartHandshakeLogo from '@/components/HeartHandshakeLogo';

export default function ChatArea() {
  const { activeSession, isStreaming, streamStatus, sendMessage, panelOutput, saveCurrentPanel } = useChat();
  const { profile } = useHealth();
  const scrollRef = useRef<ScrollView>(null);

  const hasMessages = (activeSession?.messages.length ?? 0) > 0;
  const firstName = profile?.name?.split(' ')[0] ?? null;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (hasMessages) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [activeSession?.messages.length, hasMessages]);

  if (!hasMessages) {
    return <EmptyState firstName={firstName} onSend={sendMessage} isLoading={isStreaming} />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeSession!.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isStreaming && (
          <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16 }}>
            {streamStatus && (
              <Text style={{ fontSize: 14, color: palette.slateMuted, marginBottom: 8, fontStyle: 'italic' }}>
                {streamStatus}
              </Text>
            )}
            <TypingIndicator />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <ChatInput
        onSend={sendMessage}
        isLoading={isStreaming}
        disabled={isStreaming}
      />
    </View>
  );
}

// ── Empty state (no conversation yet) ────────────────────────────────────────

function EmptyState({
  onSend,
  isLoading,
}: {
  firstName: string | null;
  onSend: (text: string) => void;
  isLoading: boolean;
}) {
    const greetings = [`What do you want to understand?`];

  const suggestions = [
    `Symptoms`,
    `Lab results`,
    `Medication`,
    `Doctor visit`,
    `Existing condition`,
    `Something else`,
  ];

  return (
    <View style={emptyStyles.root}>
      <View style={emptyStyles.center}>
        {/* Logo + greeting */}
        <View style={emptyStyles.logoRow}>
          <HeartHandshakeLogo size={40} />
        </View>
        <Text style={emptyStyles.heading}>{greetings[0]}</Text>
        <Text style={emptyStyles.sub}>
          {`Describe symptoms, lab results, questions about medication or a recent doctor visit.`}
        </Text>

        {/* Hero input */}
        <View style={emptyStyles.inputWrap}>
          <ChatInput
            onSend={onSend}
            isLoading={isLoading}
            placeholder={`Describe what is happening...`}
            hero
          />
        </View>

        {/* Suggestion chips */}
        <View style={emptyStyles.chips}>
          {suggestions.map((s) => (
            <SuggestionChip key={s} label={s} onPress={() => onSend(s)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function SuggestionChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={chipStyles.wrap}>
      <Text
        style={chipStyles.label}
        onPress={onPress}
        numberOfLines={1}
        id={`suggestion-${label.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -3,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ]),
      );

    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 140);
    const a3 = anim(dot3, 280);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={typingStyles.row}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
});

const emptyStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  center: {
    width: '100%',
    maxWidth: 640,
    alignItems: 'center',
    gap: 0,
  },
  logoRow: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: palette.slate,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
    color: palette.slateMuted,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 28,
  },
  inputWrap: {
    width: '100%',
    marginBottom: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
});

const chipStyles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(42,122,114,0.03)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(42,122,114,0.15)',
  },
  label: {
    fontSize: 14,
    color: palette.teal,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
});

const typingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.teal,
    opacity: 0.6,
  },
});
