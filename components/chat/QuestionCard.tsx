import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Text } from '@/components/Themed';
import type { ChatQuestion } from '@/types/chat';
import { palette } from '@/constants/theme';
import { useChat } from '@/context/ChatContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface Props {
  messageId: string;
  questions: ChatQuestion[];
  answered?: boolean;
}

export default function QuestionCard({ messageId, questions, answered }: Props) {
  const { sendMessage, markMessageAnswered } = useChat();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherTextByQuestion, setOtherTextByQuestion] = useState<Record<string, string>>({});
  const [otherActiveByQuestion, setOtherActiveByQuestion] = useState<Record<string, boolean>>({});
  const [additionalContext, setAdditionalContext] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const isOtherOption = (option: string) => option.trim().toLowerCase() === 'other';
  const isNoneOption = (option: string) => option.trim().toLowerCase() === 'none';

  const getOptionsWithOther = (options?: string[] | null) => {
    const safeOptions = options ?? [];
    return safeOptions.some(isOtherOption) ? safeOptions : [...safeOptions, 'Other'];
  };

  const otherAnswerFor = (questionId: string) => {
    const text = otherTextByQuestion[questionId]?.trim();
    return text || 'Other';
  };

  const withoutOtherAnswer = (questionId: string, values: string[]) => {
    const otherText = otherTextByQuestion[questionId]?.trim();
    return values.filter((value) => !isOtherOption(value) && (!otherText || value !== otherText));
  };
  
  const handleToggleOption = (questionId: string, option: string, type: 'single' | 'multi') => {
    if (answered) return;
    const optionIsOther = isOtherOption(option);
    const optionIsNone = isNoneOption(option);

    if (optionIsOther) {
      setOtherActiveByQuestion(active => ({ ...active, [questionId]: true }));
    } else if (type === 'single' || optionIsNone) {
      setOtherActiveByQuestion(active => ({ ...active, [questionId]: false }));
    }

    setAnswers(prev => {
      const current = prev[questionId];

      if (optionIsOther) {
        if (type === 'single') {
          return { ...prev, [questionId]: otherAnswerFor(questionId) };
        }

        const arr = Array.isArray(current) ? current : [];
        return { ...prev, [questionId]: [...withoutOtherAnswer(questionId, arr.filter(o => !isNoneOption(o))), otherAnswerFor(questionId)] };
      }

      if (type === 'single') {
        return { ...prev, [questionId]: option };
      } else {
        // Multi select
        const arr = Array.isArray(current) ? current : [];
        if (optionIsNone) {
          return { ...prev, [questionId]: [option] };
        }

        const arrWithoutNone = arr.filter(o => !isNoneOption(o));
        if (arr.includes(option)) {
          return { ...prev, [questionId]: arrWithoutNone.filter(o => o !== option) };
        } else {
          return { ...prev, [questionId]: [...arrWithoutNone, option] };
        }
      }
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    if (answered) return;
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleOtherTextChange = (questionId: string, text: string, type: 'single' | 'multi') => {
    if (answered) return;

    setOtherTextByQuestion(prev => ({ ...prev, [questionId]: text }));
    setAnswers(prev => {
      const answerText = text.trim() || 'Other';
      if (type === 'single') {
        return { ...prev, [questionId]: answerText };
      }

      const current = prev[questionId];
      const arr = Array.isArray(current) ? current : [];
      return { ...prev, [questionId]: [...withoutOtherAnswer(questionId, arr.filter(o => !isNoneOption(o))), answerText] };
    });
  };

  const handleSubmit = async () => {
    if (answered) return;
    
    // Format answers
    const formatted = questions.map((q, index) => {
      const answer = answers[q.id];
      let answerText = `No answer`;
      if (Array.isArray(answer)) {
        answerText = answer.length > 0 ? answer.join(', ') : `No answer`;
      } else if (answer) {
        answerText = answer;
      }
      return `${index + 1}. ${q.text}\nAnswer: ${answerText}`;
    }).join('\n\n');

    let finalMessage = `${`Here are my answers:`}\n\n${formatted}`;
    if (additionalContext.trim()) {
      finalMessage += `\n\n${`Additional context:`}\n${additionalContext.trim()}`;
    }
    
    // Mark as answered and send message
    await markMessageAnswered(messageId);
    await sendMessage(finalMessage);
  };

  const isLastStep = currentIndex === questions.length;
  const currentQuestion = isLastStep ? null : questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < questions.length) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <View style={[styles.container, answered && styles.containerDisabled]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>
          {answered ? `Completed questions` : `Question ${currentIndex + 1} of ${questions.length + 1}`}
        </Text>
        {answered && (
          <View style={styles.answeredBadge}>
            <Text style={styles.answeredBadgeText}>{`Answered`}</Text>
          </View>
        )}
      </View>
      
      {currentQuestion ? (
        <View key={currentQuestion.id} style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
          
          {(currentQuestion.type === 'single' || currentQuestion.type === 'multi') && (
            <View style={styles.optionsContainer}>
              {getOptionsWithOther(currentQuestion.options).map(opt => {
                const currentAnswer = answers[currentQuestion.id];
                const optionIsOther = isOtherOption(opt);
                const isOtherActive = otherActiveByQuestion[currentQuestion.id] === true;
                const isSelected = currentQuestion.type === 'single' 
                  ? (optionIsOther ? isOtherActive : currentAnswer === opt)
                  : (optionIsOther ? isOtherActive : Array.isArray(currentAnswer) && currentAnswer.includes(opt));
                  
                return (
                  <View key={opt} style={optionIsOther && isSelected ? styles.otherOption : undefined}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                        answered && styles.chipDisabled
                      ]}
                      onPress={() => handleToggleOption(currentQuestion.id, opt, currentQuestion.type as 'single' | 'multi')}
                      disabled={answered}
                    >
                      <Text style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected
                      ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                    {optionIsOther && isSelected && (
                      <TextInput
                        style={[
                          styles.otherInput,
                          answered && styles.textInputDisabled
                        ]}
                        placeholder={`Type your answer...`}
                        placeholderTextColor={palette.slateSubtle}
                        value={otherTextByQuestion[currentQuestion.id] || ''}
                        onChangeText={(text) => handleOtherTextChange(currentQuestion.id, text, currentQuestion.type as 'single' | 'multi')}
                        editable={!answered}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}
          
          {currentQuestion.type === 'free_text' && (
            <TextInput
              style={[
                styles.textInput,
                answered && styles.textInputDisabled
              ]}
              placeholder={`Type your answer here...`}
              placeholderTextColor={palette.slate}
              value={(answers[currentQuestion.id] as string) || ''}
              onChangeText={(text) => handleTextChange(currentQuestion.id, text)}
              editable={!answered}
              multiline
            />
          )}
        </View>
      ) : (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{`Anything else to add? (Optional)`}</Text>
          <TextInput
            style={[
              styles.textInput,
              answered && styles.textInputDisabled
            ]}
            placeholder={`Write any additional context here...`}
            placeholderTextColor={palette.slateSubtle}
            value={additionalContext}
            onChangeText={setAdditionalContext}
            editable={!answered}
            multiline
          />
        </View>
      )}

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]} 
          onPress={handleBack}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={20} color={currentIndex === 0 ? palette.slateSubtle : palette.slate} />
          <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>{`Back`}</Text>
        </TouchableOpacity>

        {!answered ? (
          isLastStep ? (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{`Submit answers`}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.navBtnPrimary} onPress={handleNext}>
              <Text style={styles.navBtnPrimaryText}>{`Next`}</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )
        ) : (
          !isLastStep ? (
            <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
              <Text style={styles.navBtnText}>{`Next`}</Text>
              <ChevronRight size={20} color={palette.slate} />
            </TouchableOpacity>
          ) : <View style={{ width: 80 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerDisabled: {
    opacity: 0.7,
  },
  header: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: palette.slate,
    marginBottom: 12,
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: palette.slate,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  chipSelected: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  chipDisabled: {
    opacity: 0.8,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: palette.slate,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  otherOption: {
    width: '100%',
    gap: 8,
  },
  otherInput: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 10,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: palette.slate,
  },
  textInput: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: palette.slate,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInputDisabled: {
    backgroundColor: '#E4E4E7',
    color: '#71717A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    paddingTop: 16,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    color: palette.slate,
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    marginHorizontal: 4,
  },
  navBtnTextDisabled: {
    color: palette.slateSubtle,
  },
  navBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  navBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    marginRight: 4,
  },
  submitBtn: {
    backgroundColor: palette.teal,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  answeredBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
  },
  answeredBadgeText: {
    color: '#0284C7',
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },
});
