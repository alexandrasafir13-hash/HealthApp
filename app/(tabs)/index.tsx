
import { View, StyleSheet } from 'react-native';
import ChatArea from '@/components/chat/ChatArea';
import { palette } from '@/constants/theme';

/**
 * The main screen is now the chat interface.
 * All health conversations happen here.
 */
export default function ChatScreen() {
  return (
    <View style={styles.root}>
      <ChatArea />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
});
