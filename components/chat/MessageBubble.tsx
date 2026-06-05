
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import type { ChatMessage } from '@/types/chat';
import { palette } from '@/constants/theme';
import PanelContent from '@/components/chat/PanelContent';
import { useChat } from '@/context/ChatContext';
import QuestionCard from '@/components/chat/QuestionCard';

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  // If the app has already saved this, it has an ID, but here we might just have message.panel
  // Actually, once generated, we just show it. We don't need a Save button for old history items
  // unless they haven't been saved to the case yet. For simplicity, we just render it without save button
  // in the chat history, since the user usually saves it when it's actively generated.

  if (isUser) {
    return (
      <View style={styles.userOuter}>
        <View style={styles.userCard}>
          <Text style={styles.contentUser}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantContainer}>
      <Text style={styles.contentAssistant}>
        {message.content}
      </Text>
      {message.questions && message.questions.length > 0 && (
        <QuestionCard 
          messageId={message.id} 
          questions={message.questions} 
          answered={message.answered} 
        />
      )}
      {message.panel && (
        <PanelContent output={message.panel} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userOuter: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  userCard: {
    backgroundColor: '#F0F5F3',
    borderColor: '#DCE8E3',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contentUser: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito_400Regular',
    color: palette.slate,
  },
  assistantContainer: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  contentAssistant: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'Nunito_400Regular',
    color: palette.slate,
  },
});
