import { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { ArrowUp } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  /** If true, renders the large centered empty-state input */
  hero?: boolean;
}

export default function ChatInput({
  onSend,
  disabled,
  isLoading,
  placeholder,
  hero = false,
}: Props) {
    const { isAuthenticated } = useAuth();
  const activePlaceholder = placeholder || `Describe what is happening...`;
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);



  const canSend = text.trim().length > 0 && !disabled && !isLoading;

  const handleSend = () => {
    if (!canSend) return;
    const msg = text.trim();
    setText('');
    onSend(msg);
    inputRef.current?.focus();
  };

  if (hero) {
    return (
      <View style={heroStyles.wrap}>
        <View style={heroStyles.inputRow}>

          <TextInput
            ref={inputRef}
            style={heroStyles.input}
            value={text}
            onChangeText={setText}
            placeholder={activePlaceholder}
            placeholderTextColor="rgba(100,120,115,0.55)"
            multiline
            onKeyPress={(e: any) => {
              if (Platform.OS === 'web' && e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            editable={!disabled}
            id="chat-hero-input"
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              heroStyles.sendBtn,
              canSend && heroStyles.sendBtnActive,
              pressed && canSend && { opacity: 0.8 },
            ]}
            id="chat-hero-send-btn"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ArrowUp size={18} color={canSend ? '#fff' : 'rgba(100,120,115,0.4)'} />
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.bar}>
        <View style={styles.innerBar}>
          <View style={styles.inputRow}>

            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={activePlaceholder}
              placeholderTextColor="rgba(100,120,115,0.5)"
              multiline
              maxLength={2000}
              onKeyPress={(e: any) => {
                if (Platform.OS === 'web' && e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              editable={!disabled}
              id="chat-input"
            />
            <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              canSend && styles.sendBtnActive,
              pressed && canSend && { transform: [{ scale: 0.97 }] },
            ]}
            id="chat-send-btn"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={canSend ? '#fff' : palette.slateMuted} />
            ) : (
              <ArrowUp size={16} color={canSend ? '#fff' : 'rgba(100,120,115,0.4)'} />
            )}
          </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Hero (empty state) styles ─────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(42,122,114,0.18)',
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 24px rgba(42,122,114,0.12)' }
      : { shadowColor: palette.teal, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 }),
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Nunito_400Regular',
    color: palette.slate,
    maxHeight: 200,
    paddingTop: 6,
    paddingBottom: 6,
    outlineStyle: 'none',
  } as any,
  attachBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(42,122,114,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnActive: {
    backgroundColor: palette.teal,
  },
});

// ── Bottom bar (conversation mode) styles ─────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  innerBar: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(42,122,114,0.12)',
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }
      : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }),
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: palette.slate,
    maxHeight: 200,
    paddingTop: 6,
    paddingBottom: 6,
    outlineStyle: 'none',
  } as any,
  attachBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(42,122,114,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnActive: {
    backgroundColor: palette.teal,
  },
});
