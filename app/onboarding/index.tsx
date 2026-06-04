import { useRouter } from 'expo-router';
import { AlertCircle, Check, ChevronLeft, Send, Sparkles, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HeartHandshakeLogo from '@/components/HeartHandshakeLogo';
import { Text } from '@/components/Themed';
import { palette, cardShadow } from '@/constants/theme';
import { useHealth } from '@/context/HealthContext';
import { useAuth } from '@/context/AuthContext';
import { PAGE_MAX_WIDTH } from '@/hooks/useBreakpoint';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { fetchOnboardingChatNextTurn, OnboardingMessage, OnboardingQuestion } from '@/lib/onboardingChat';
import { BiologicalSex, UserProfile } from '@/types/onboarding';

function detectHabitIds(fullText: string): string[] {
  if (
    fullText.includes('sleep') ||
    fullText.includes('tired') ||
    fullText.includes('bed') ||
    fullText.includes('insomnia') ||
    fullText.includes('night') ||
    fullText.includes('rest')
  ) {
    return ['sleep-schedule'];
  }
  if (
    fullText.includes('move') ||
    fullText.includes('exercise') ||
    fullText.includes('activity') ||
    fullText.includes('walk') ||
    fullText.includes('gym') ||
    fullText.includes('run') ||
    fullText.includes('sport') ||
    fullText.includes('fit')
  ) {
    return ['exercise-routine'];
  }
  if (
    fullText.includes('eat') ||
    fullText.includes('food') ||
    fullText.includes('diet') ||
    fullText.includes('meal') ||
    fullText.includes('cook') ||
    fullText.includes('nutrition') ||
    fullText.includes('snack')
  ) {
    return ['eating-habits'];
  }
  if (
    fullText.includes('water') ||
    fullText.includes('hydrat') ||
    fullText.includes('drink')
  ) {
    return ['hydration'];
  }
  if (
    fullText.includes('phone') ||
    fullText.includes('screen') ||
    fullText.includes('social') ||
    fullText.includes('instagram') ||
    fullText.includes('tiktok') ||
    fullText.includes('scroll')
  ) {
    return ['screen-time'];
  }
  return ['sleep-schedule'];
}

function processOnboardingResponse(
  response: any,
  currentProfileData: Partial<UserProfile>
) {
  const nextProfileData = { ...currentProfileData };
  let nextOptName = '';
  let nextOptAge = '';
  let nextOptSex: BiologicalSex | null = null;
  let nextOptWeight = '';
  let nextOptHeight = '';
  let finalExtractedProfile = null;
  let chatQuestions: any[] = [];
  // LLM-driven flags — default to false if not present
  let showBiometrics = response.askForBiometrics === true;

  if (response.extractedProfile) {
    const ext = response.extractedProfile;
    
    if (ext.name) nextProfileData.name = ext.name;
    if (ext.age) nextProfileData.age = ext.age;
    if (ext.sex) nextProfileData.sex = ext.sex as BiologicalSex;
    if (ext.weightKg) nextProfileData.weightKg = ext.weightKg;
    if (ext.heightCm) nextProfileData.heightCm = ext.heightCm;
    if (ext.habitIds && ext.habitIds.length > 0) nextProfileData.habitIds = ext.habitIds;
    if (ext.physicalConcernIds && ext.physicalConcernIds.length > 0)
      nextProfileData.physicalConcernIds = ext.physicalConcernIds;
  }

  if (response.complete) {
    let mergedProfile = response.extractedProfile;
    if (response.extractedProfile) {
      const ext = response.extractedProfile;
      const mergedName = ext.name || currentProfileData.name || '';
      const mergedAge = ext.age != null ? ext.age : currentProfileData.age;
      const mergedSex = (ext.sex as BiologicalSex) || currentProfileData.sex || null;
      const mergedWeight = ext.weightKg != null ? ext.weightKg : currentProfileData.weightKg;
      const mergedHeight = ext.heightCm != null ? ext.heightCm : currentProfileData.heightCm;

      mergedProfile = {
        ...ext,
        name: mergedName || null,
        age: mergedAge !== undefined ? mergedAge : null,
        sex: mergedSex || null,
        weightKg: mergedWeight !== undefined ? mergedWeight : null,
        heightCm: mergedHeight !== undefined ? mergedHeight : null,
      };

      nextOptName = mergedName;
      nextOptAge = mergedAge != null ? String(mergedAge) : '';
      nextOptSex = mergedSex;
      nextOptWeight = mergedWeight != null ? String(mergedWeight) : '';
      nextOptHeight = mergedHeight != null ? String(mergedHeight) : '';
    }

    finalExtractedProfile = mergedProfile;
    chatQuestions = [];
  } else {
    chatQuestions = response.questions ?? [];
  }

  return {
    nextProfileData,
    nextOptName,
    nextOptAge,
    nextOptSex,
    nextOptWeight,
    nextOptHeight,
    finalExtractedProfile,
    chatQuestions,
    showMedicalStep: false,
    showBiometrics,
    userStory: response.complete && response.userStory ? response.userStory : null,
  };
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(600),
        ])
      ).start();
    };
    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

const PLACEHOLDERS = [
  "I eat too much junk food...",
  "I don't read enough...",
  "I don’t move enough...",
  "I feel low on energy...",
  "I wake up very tired...",
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { isTabletUp } = usePageLayout();
  const router = useRouter();
  const { completeOnboarding, profile, isRestoring, personalPlan } = useHealth();
  const { signInWithGoogle, loading: authLoading, user, isAuthenticated, signOutUser } = useAuth();

  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // If the user is already authenticated and has a profile (e.g. returning from
  // signInWithRedirect which lands back on /onboarding), send them to the appropriate screen.
  useEffect(() => {
    if (!isRestoring && profile) {
      if (!personalPlan) {
        router.replace('/plan-ready');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isRestoring, profile, personalPlan]);

  // Auto-prefill Google account name if authenticated
  useEffect(() => {
    if (user && user.displayName) {
      setOptName((prev) => prev || user.displayName || '');
      setProfileData((prev) => ({
        ...prev,
        name: prev.name || user.displayName || undefined,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (messages.length !== 0) return;

    const interval = setInterval(() => {
      // Slide up and fade out current placeholder
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateYAnim, {
          toValue: -15,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        // Change text index to next placeholder
        setCurrentIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
        
        // Reset translate position below center so it can slide up
        translateYAnim.setValue(15);
        
        // Slide up and fade in new placeholder
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [finalExtractedProfile, setFinalExtractedProfile] = useState<any>(null);
  const [finalUserStory, setFinalUserStory] = useState<any>(null);
  const [chatQuestions, setChatQuestions] = useState<OnboardingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [turnAnswers, setTurnAnswers] = useState<Record<number, { selected: string[]; custom: string }>>({});
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    name: '',
    age: undefined,
    sex: undefined,
    weightKg: undefined,
    heightCm: undefined,
    habitIds: [],
    physicalConcernIds: [],
  });

  // Tailoring step state
  const [showBiometrics, setShowBiometrics] = useState(false);

  // Optional biometric form states (for end of chat screen)
  const [optName, setOptName] = useState('');
  const [optAge, setOptAge] = useState('');
  const [optSex, setOptSex] = useState<BiologicalSex | null>(null);
  const [optWeight, setOptWeight] = useState('');
  const [optHeight, setOptHeight] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  // Tracks the true LLM-facing history, which may differ from display messages
  // (e.g. wizard turns use interleaved assistant/user pairs in the API but a
  // compiled bubble in the UI). Always read from this ref when calling the LLM.
  const llmMessagesRef = useRef<OnboardingMessage[]>([]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  // When the LLM determines that biometrics is not relevant, complete immediately.
  useEffect(() => {
    if (isChatComplete && !showBiometrics && finalExtractedProfile) {
      handleComplete(finalExtractedProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatComplete, showBiometrics]);

  const currentPhase = useMemo(() => {
    if (!isChatComplete) return 1;
    return 3;
  }, [isChatComplete]);

  const userMessageCount = useMemo(() => messages.filter((m) => m.role === 'user').length, [messages]);

  const phase1Progress = useMemo(() => {
    if (currentPhase > 1) return 1.0;
    
    let base = 0.2;
    let stepWeight = 0.3;
    if (userMessageCount === 1) {
      base = 0.25;
      stepWeight = 0.35;
    } else if (userMessageCount === 2) {
      base = 0.65;
      stepWeight = 0.2;
    } else if (userMessageCount >= 3) {
      base = 0.85;
      stepWeight = 0.15;
    }
    
    const wizardProgress = chatQuestions.length > 0 ? (currentQuestionIndex / chatQuestions.length) : 0;
    return base + (stepWeight * wizardProgress);
  }, [currentPhase, userMessageCount, chatQuestions.length, currentQuestionIndex]);

  const phase3Progress = useMemo(() => {
    if (currentPhase < 3) return 0.0;
    let filledCount = 0;
    if (optName.trim()) filledCount++;
    if (optAge.trim()) filledCount++;
    if (optSex) filledCount++;
    if (optWeight.trim()) filledCount++;
    if (optHeight.trim()) filledCount++;
    return 0.15 + 0.85 * (filledCount / 5);
  }, [currentPhase, optName, optAge, optSex, optWeight, optHeight]);

  const handleComplete = async (finalProfile?: {
    name?: string | null;
    age?: number | null;
    sex?: BiologicalSex | null;
    weightKg?: number | null;
    heightCm?: number | null;
    habitIds?: string[] | null;
    physicalConcernIds?: string[] | null;
  }) => {
    setSaving(true);
    setError(null);
    try {
      const accumulated = {
        name: finalProfile?.name !== null ? finalProfile?.name : undefined,
        age: finalProfile?.age !== null ? finalProfile?.age : undefined,
        sex: finalProfile?.sex !== null ? finalProfile?.sex : undefined,
        weightKg: finalProfile?.weightKg !== null ? finalProfile?.weightKg : undefined,
        heightCm: finalProfile?.heightCm !== null ? finalProfile?.heightCm : undefined,
        habitIds: finalProfile?.habitIds !== null ? finalProfile?.habitIds : undefined,
        physicalConcernIds: finalProfile?.physicalConcernIds !== null ? finalProfile?.physicalConcernIds : undefined,
      };

      const name = (accumulated.name ?? profileData.name)?.trim() || undefined;
      const age = accumulated.age ?? profileData.age;
      const sex = accumulated.sex ?? profileData.sex;
      const weightKg = accumulated.weightKg ?? profileData.weightKg;
      const heightCm = accumulated.heightCm ?? profileData.heightCm;

      const fullText = messages.map((m) => m.content.toLowerCase()).join(' ');

      let habitIds = accumulated.habitIds ?? [];
      if (habitIds.length === 0) {
        habitIds = detectHabitIds(fullText);
      }

      const physicalConcernIds: string[] = (accumulated.physicalConcernIds as string[]) ?? profileData.physicalConcernIds ?? [];

      await completeOnboarding({
        name,
        age,
        sex,
        weightKg,
        heightCm,
        dataMethods: [],
        habitIds,
        physicalConcernIds,
        goalDetails: {},
        onboardingMessages: messages,
        onboardingUserStory: finalUserStory ?? undefined,
      });
      router.replace('/plan-ready');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setError('Could not design your routine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentAnswer = (index: number) => {
    return turnAnswers[index] ?? { selected: [], custom: '' };
  };

  const updateCurrentAnswer = (index: number, selected: string[], custom: string) => {
    setTurnAnswers((prev) => ({
      ...prev,
      [index]: { selected, custom },
    }));
  };

  const toggleOptionSelected = (option: string) => {
    const q = chatQuestions[currentQuestionIndex];
    if (!q) return;
    const current = getCurrentAnswer(currentQuestionIndex);
    let nextSelected: string[];
    if (q.type === 'single') {
      nextSelected = [option];
    } else {
      nextSelected = [...current.selected];
      if (nextSelected.includes(option)) {
        nextSelected = nextSelected.filter((o) => o !== option);
      } else {
        nextSelected.push(option);
      }
    }
    updateCurrentAnswer(currentQuestionIndex, nextSelected, current.custom);
  };

  const handleCustomTextChange = (text: string) => {
    const current = getCurrentAnswer(currentQuestionIndex);
    updateCurrentAnswer(currentQuestionIndex, current.selected, text);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading || saving) return;

    const userMsg = inputText.trim();
    setInputText('');
    setError(null);
    setIsChatComplete(false);
    setFinalExtractedProfile(null);
    setChatQuestions([]);
    setCurrentQuestionIndex(0);
    setTurnAnswers({});

    const userMessage: OnboardingMessage = { role: 'user', content: userMsg };
    // Free-text turns are identical for display and LLM history
    const nextMessages = [...llmMessagesRef.current, userMessage];
    llmMessagesRef.current = nextMessages;
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetchOnboardingChatNextTurn(nextMessages);
      const result = processOnboardingResponse(response, profileData);

      setProfileData(result.nextProfileData);
      const assistantMessage: OnboardingMessage = { role: 'assistant', content: response.nextQuestion };
      llmMessagesRef.current = [...llmMessagesRef.current, assistantMessage];
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.complete) {
        setIsChatComplete(true);
        setShowBiometrics(result.showBiometrics);
        setOptName(result.nextOptName);
        setOptAge(result.nextOptAge);
        setOptSex(result.nextOptSex);
        setOptWeight(result.nextOptWeight);
        setOptHeight(result.nextOptHeight);
        setFinalExtractedProfile(result.finalExtractedProfile);
        setFinalUserStory(result.userStory);
        setChatQuestions([]);
      } else {
        setChatQuestions(result.chatQuestions);
        setCurrentQuestionIndex(0);
        setTurnAnswers({});
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Oops! I ran into an issue connecting. Please try re-sending.');
      setChatQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMultiQuestions = async () => {
    if (loading || saving) return;

    // Build interleaved assistant/user pairs for the API (clean Q&A without labels)
    const interleaved: OnboardingMessage[] = [];
    // Build a compact display message for the chat UI (as before)
    const compiledParts: string[] = [];

    for (let i = 0; i < chatQuestions.length; i++) {
      const q = chatQuestions[i];
      const ans = turnAnswers[i] ?? { selected: [], custom: '' };

      const selections = [...ans.selected];
      if (ans.custom.trim()) {
        selections.push(ans.custom.trim());
      }

      if (selections.length > 0) {
        interleaved.push({ role: 'assistant', content: q.text });
        interleaved.push({ role: 'user', content: selections.join(', ') });
        compiledParts.push(selections.join(', '));
      }
    }

    if (interleaved.length === 0) return;

    setChatQuestions([]);
    setCurrentQuestionIndex(0);
    setTurnAnswers({});
    setError(null);
    setIsChatComplete(false);
    setFinalExtractedProfile(null);

    // UI: show the compiled answers as a single user bubble (same as before)
    const displayMsg: OnboardingMessage = { role: 'user', content: compiledParts.join('\n') };
    setMessages((prev) => [...prev, displayMsg]);

    // API: append interleaved pairs to the persistent LLM history
    const apiMessages = [...llmMessagesRef.current, ...interleaved];
    llmMessagesRef.current = apiMessages;
    setLoading(true);

    try {
      const response = await fetchOnboardingChatNextTurn(apiMessages);
      const result = processOnboardingResponse(response, profileData);

      setProfileData(result.nextProfileData);
      const assistantMessage: OnboardingMessage = { role: 'assistant', content: response.nextQuestion };
      llmMessagesRef.current = [...llmMessagesRef.current, assistantMessage];
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.complete) {
        setIsChatComplete(true);
        setShowBiometrics(result.showBiometrics);
        setOptName(result.nextOptName);
        setOptAge(result.nextOptAge);
        setOptSex(result.nextOptSex);
        setOptWeight(result.nextOptWeight);
        setOptHeight(result.nextOptHeight);
        setFinalExtractedProfile(result.finalExtractedProfile);
        setFinalUserStory(result.userStory);
        setChatQuestions([]);
      } else {
        setChatQuestions(result.chatQuestions);
        setCurrentQuestionIndex(0);
        setTurnAnswers({});
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Oops! I ran into an issue connecting. Please try re-sending.');
      setChatQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWizardNext
    = () => {
      const current = getCurrentAnswer(currentQuestionIndex);
      const hasAnswer = current.selected.length > 0 || current.custom.trim().length > 0;
      if (!hasAnswer) return;

      if (currentQuestionIndex < chatQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        handleSendMultiQuestions();
      }
    };

  const handleWizardBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goBack = () => {
    if (messages.length > 0) {
      // Pop the last user message and the subsequent assistant response
      setMessages((prev) => prev.slice(0, -2));
      setError(null);
      setChatQuestions([]);
      setIsChatComplete(false);
      setFinalExtractedProfile(null);
    } else {
      if (router.canGoBack()) {
        router.back();
      }
    }
  };

  const handleCompleteWithOptionalData = () => {
    const finalProfile = {
      name: optName.trim() || null,
      age: optAge.trim() ? parseInt(optAge.trim(), 10) : null,
      sex: optSex || null,
      weightKg: optWeight.trim() ? parseFloat(optWeight.trim()) : null,
      heightCm: optHeight.trim() ? parseFloat(optHeight.trim()) : null,
      habitIds: finalExtractedProfile?.habitIds ?? profileData.habitIds ?? null,
      physicalConcernIds: finalExtractedProfile?.physicalConcernIds ?? profileData.physicalConcernIds ?? null,
    };
    handleComplete(finalProfile);
  };

  if (saving) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.teal} />
        <Text style={styles.loadingTitle}>Analyzing your profile...</Text>
        <Text style={styles.loadingSub}>Designing your tailored program with behavioral guardrails.</Text>
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <OnboardingInitialScreen
        insets={insets}
        isTabletUp={isTabletUp}
        inputText={inputText}
        setInputText={setInputText}
        handleSend={handleSend}
        loading={loading}
        saving={saving}
        fadeAnim={fadeAnim}
        translateYAnim={translateYAnim}
        currentIdx={currentIdx}
        signInWithGoogle={signInWithGoogle}
        authLoading={authLoading}
        isAuthenticated={isAuthenticated}
        user={user}
        signOutUser={signOutUser}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[pageStyles.scroll, styles.screen]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <View
        style={[
          styles.container,
          isTabletUp ? styles.containerTablet : styles.containerPhone,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8, maxWidth: PAGE_MAX_WIDTH },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <HeartHandshakeLogo size={32} />
            </View>
            <Text style={styles.headerTitle}>Healthee</Text>
          </View>
        </View>

        <View style={styles.segmentedProgressContainer}>
          {/* Intake Phase */}
          <View style={styles.progressSegmentWrapper}>
            <View style={styles.progressSegmentTrack}>
              <View style={[styles.progressSegmentFill, { width: `${phase1Progress * 100}%` }]} />
            </View>
          </View>

          {/* Tailoring Phase */}
          <View style={styles.progressSegmentWrapper}>
            <View style={styles.progressSegmentTrack}>
              <View style={[styles.progressSegmentFill, { width: `${phase3Progress * 100}%` }]} />
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const cleanContent = msg.content.replace(/\*\*/g, '');
            return (
              <View key={index} style={[styles.messageRow, isUser ? styles.rowUser : styles.rowAssistant]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textAssistant]}>
                    {cleanContent}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageRow, styles.rowAssistant]}>
              <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                <TypingIndicator />
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorRow}>
              <AlertCircle size={18} color={palette.high} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && !isChatComplete && chatQuestions.length > 0 && (
            <View style={styles.optionsContainer}>
              <View style={styles.wizardBadge}>
                <Text style={styles.wizardBadgeText}>
                  STEP {currentQuestionIndex + 1} OF {chatQuestions.length}
                </Text>
              </View>
              <View style={styles.wizardHeader}>
                <Text style={styles.wizardQuestionText}>
                  {chatQuestions[currentQuestionIndex].text}
                </Text>
              </View>

              {chatQuestions[currentQuestionIndex].options.map((opt, oIdx) => {
                const currentAnswer = getCurrentAnswer(currentQuestionIndex);
                const isSelected = currentAnswer.selected.includes(opt);
                return (
                  <Pressable
                    key={oIdx}
                    style={[
                      styles.optionChip,
                      isSelected && styles.optionChipSelected
                    ]}
                    onPress={() => toggleOptionSelected(opt)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}>
                    <View style={styles.optionChipInner}>
                      <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                        {opt}
                      </Text>
                      <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorSelected]}>
                        {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                      </View>
                    </View>
                  </Pressable>
                );
              })}

              <View style={styles.inlineInputContainer}>
                <TextInput
                  style={styles.inlineInputField}
                  placeholder="Write my own..."
                  placeholderTextColor={palette.slateSubtle}
                  value={getCurrentAnswer(currentQuestionIndex).custom}
                  onChangeText={handleCustomTextChange}
                  maxLength={300}
                  autoCorrect={true}
                  editable={!loading && !saving}
                  onSubmitEditing={handleWizardNext}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.wizardNavTray}>
                {currentQuestionIndex > 0 ? (
                  <Pressable
                    style={styles.wizardBackButton}
                    onPress={handleWizardBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back">
                    <Text style={styles.wizardBackButtonText}>Back</Text>
                  </Pressable>
                ) : (
                  <View style={{ width: 0 }} />
                )}

                {(() => {
                  const currentAnswer = getCurrentAnswer(currentQuestionIndex);
                  const isStepDisabled = currentAnswer.selected.length === 0 && !currentAnswer.custom.trim();
                  const isLastStep = currentQuestionIndex === chatQuestions.length - 1;
                  return (
                    <Pressable
                      style={[
                        styles.wizardNextButton,
                        isStepDisabled && styles.wizardNextButtonDisabled,
                        currentQuestionIndex === 0 && { flex: 1 }
                      ]}
                      onPress={handleWizardNext}
                      disabled={isStepDisabled || loading || saving}
                      accessibilityRole="button"
                      accessibilityLabel={isLastStep ? "Submit selections" : "Go to next step"}>
                      {isLastStep ? (
                        <>
                          <Send size={14} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.wizardNextButtonText}>Submit Answer</Text>
                        </>
                      ) : (
                        <Text style={styles.wizardNextButtonText}>Next Step</Text>
                      )}
                    </Pressable>
                  );
                })()}
              </View>
            </View>
          )}

          {!loading && !isChatComplete && chatQuestions.length === 0 && (
            <View style={styles.openQuestionContainer}>
              <View style={styles.initialInputPill}>
                <View style={styles.initialPillIconLeft}>
                  <HeartHandshakeLogo size={22} />
                </View>
                <TextInput
                  style={styles.initialInputField}
                  placeholder="Tell me what you'd like to change..."
                  placeholderTextColor={palette.slateSubtle}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  editable={!loading && !saving}
                  autoFocus={true}
                />
                <Pressable
                  style={[
                    styles.initialPillSend,
                    { backgroundColor: inputText.trim() ? palette.teal : '#F1F5F9' }
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || loading || saving}
                  accessibilityRole="button">
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: inputText.trim() ? '#fff' : '#94A3B8',
                      textTransform: 'uppercase',
                    }}
                  >
                    send
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {isChatComplete && showBiometrics && (
            <BiometricsTailoringCard
              isTabletUp={isTabletUp}
              optName={optName}
              setOptName={setOptName}
              optAge={optAge}
              setOptAge={setOptAge}
              optSex={optSex}
              setOptSex={setOptSex}
              optWeight={optWeight}
              setOptWeight={setOptWeight}
              optHeight={optHeight}
              setOptHeight={setOptHeight}
              onBack={goBack}
              handleCompleteWithOptionalData={handleCompleteWithOptionalData}
              handleComplete={handleComplete}
              finalExtractedProfile={finalExtractedProfile}
            />
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

interface OnboardingInitialScreenProps {
  insets: any;
  isTabletUp: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  handleSend: () => void;
  loading: boolean;
  saving: boolean;
  fadeAnim: any;
  translateYAnim: any;
  currentIdx: number;
  signInWithGoogle: () => void;
  authLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  signOutUser: () => void;
}

function OnboardingInitialScreen({
  insets,
  isTabletUp,
  inputText,
  setInputText,
  handleSend,
  loading,
  saving,
  fadeAnim,
  translateYAnim,
  currentIdx,
  signInWithGoogle,
  authLoading,
  isAuthenticated,
  user,
  signOutUser,
}: OnboardingInitialScreenProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'login' | 'signup'>('login');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isInputFocused && !isTabletUp) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isInputFocused, isTabletUp]);

  return (
    <KeyboardAvoidingView
      style={[pageStyles.scroll, styles.initialScreen]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.initialContainer,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24, maxWidth: PAGE_MAX_WIDTH },
        ]}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
      >
        <View style={styles.initialHeader}>
          <View style={styles.initialHeaderLeft}>
            <View style={styles.initialLogo}>
              <HeartHandshakeLogo size={52} />
            </View>
            <Text style={styles.initialAppName}>Healthee</Text>
          </View>
          <View style={styles.initialHeaderRight}>
            {isAuthenticated && user ? (
              <View style={styles.loggedInHeaderContainer}>
                {user.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.headerAvatar} />
                ) : (
                  <View style={styles.headerAvatarPlaceholder}>
                    <Text style={styles.headerAvatarPlaceholderText}>
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <Pressable
                  style={styles.headerSignOutButton}
                  onPress={signOutUser}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out">
                  <Text style={styles.headerSignOutText}>Sign out</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  style={styles.loginButton}
                  onPress={() => {
                    setModalType('login');
                    setShowModal(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Login">
                  <Text style={styles.loginButtonText}>Login</Text>
                </Pressable>
                <Pressable
                  style={styles.signupButton}
                  onPress={() => {
                    setModalType('signup');
                    setShowModal(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Sign up">
                  <Text style={styles.signupButtonText}>Sign up</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        <Modal
          visible={showModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalType === 'login' ? 'Welcome Back' : 'Create Account'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {modalType === 'login'
                    ? 'Sign in to access and restore your health program.'
                    : 'Register to backup your personal routines securely to the cloud.'}
                </Text>
              </View>

              <View style={styles.modalOptions}>
                {/* Google - ACTIVE */}
                <Pressable
                  style={styles.modalOptionButtonActive}
                  onPress={() => {
                    setShowModal(false);
                    signInWithGoogle();
                  }}
                  disabled={authLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Google">
                  {authLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalOptionTextActive}>Continue with Google</Text>
                  )}
                </Pressable>

                {/* Apple - DISABLED */}
                <View style={styles.modalOptionButtonDisabled}>
                  <Text style={styles.modalOptionTextDisabled}>Continue with Apple (Soon)</Text>
                </View>

                {/* Email - DISABLED */}
                <View style={styles.modalOptionButtonDisabled}>
                  <Text style={styles.modalOptionTextDisabled}>Continue with Email (Soon)</Text>
                </View>
              </View>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <View style={[styles.initialCenteredContent, isInputFocused && !isTabletUp && { justifyContent: 'flex-end', paddingTop: 40 }]}>
          <View style={styles.initialTextContainer}>
            <Text style={[styles.initialTitle, !isTabletUp && { fontSize: 24, lineHeight: 30 }]}>What do you need help with?</Text>
            <Text style={styles.initialSubtitle}>
              Describe what's been hard lately. You don't need to know why.
            </Text>
          </View>

          <View style={styles.initialInputPill}>
            <View style={styles.initialPillIconLeft}>
              <HeartHandshakeLogo size={22} />
            </View>
            <TextInput
              style={styles.initialInputField}
              placeholder=""
              placeholderTextColor={palette.slateSubtle}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!loading && !saving}
              autoFocus={true}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            {inputText.length === 0 && (
              <View style={[styles.placeholderContainer, { pointerEvents: 'none' }]}>
                <Animated.Text
                  style={[
                    styles.placeholderText,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateYAnim }],
                    },
                  ]}
                >
                  {PLACEHOLDERS[currentIdx]}
                </Animated.Text>
              </View>
            )}
            <Pressable
              style={[
                styles.initialPillSend,
                { backgroundColor: inputText.trim() ? palette.teal : '#F1F5F9' }
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading || saving}
              accessibilityRole="button">
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: inputText.trim() ? '#fff' : '#94A3B8',
                  textTransform: 'uppercase',
                }}
              >
                send
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface BiometricsTailoringCardProps {
  isTabletUp: boolean;
  optName: string;
  setOptName: (text: string) => void;
  optAge: string;
  setOptAge: (text: string) => void;
  optSex: BiologicalSex | null;
  setOptSex: (sex: BiologicalSex | null) => void;
  optWeight: string;
  setOptWeight: (text: string) => void;
  optHeight: string;
  setOptHeight: (text: string) => void;
  onBack: () => void;
  handleCompleteWithOptionalData: () => void;
  handleComplete: (profile: any) => void;
  finalExtractedProfile: any;
}

function BiometricsTailoringCard({
  isTabletUp,
  optName,
  setOptName,
  optAge,
  setOptAge,
  optSex,
  setOptSex,
  optWeight,
  setOptWeight,
  optHeight,
  setOptHeight,
  onBack,
  handleCompleteWithOptionalData,
  handleComplete,
  finalExtractedProfile,
}: BiometricsTailoringCardProps) {
  return (
    <View style={styles.biometricsCard}>
      <View style={styles.biometricsHeader}>
        <Pressable
          style={styles.biometricsBack}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to chat">
          <ChevronLeft size={20} color={palette.teal} />
        </Pressable>
        <Text style={styles.biometricsTitle}>Tailor Your Wellness Plan</Text>
      </View>
      <Text style={styles.biometricsSubtitle}>
        These details are entirely optional, but they help us design a safer, highly optimized, and personalized wellness program.
      </Text>

      {/* Name Input */}
      <View style={styles.inlineInputGroup}>
        <Text style={styles.inlineInputLabel}>Full Name (Optional)</Text>
        <TextInput
          style={styles.inlineInputFieldBordered}
          placeholder="Enter your name"
          placeholderTextColor={palette.slateSubtle}
          value={optName}
          onChangeText={setOptName}
          maxLength={80}
          onSubmitEditing={handleCompleteWithOptionalData}
          returnKeyType="done"
        />
      </View>

      {/* Age Input */}
      <View style={styles.inlineInputGroup}>
        <Text style={styles.inlineInputLabel}>Age (Optional)</Text>
        <TextInput
          style={styles.inlineInputFieldBordered}
          placeholder="Years"
          placeholderTextColor={palette.slateSubtle}
          value={optAge}
          onChangeText={(text) => setOptAge(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={3}
          onSubmitEditing={handleCompleteWithOptionalData}
          returnKeyType="done"
        />
      </View>

      {/* Biological Sex Selector */}
      <View style={styles.inlineInputGroup}>
        <Text style={styles.inlineInputLabel}>Biological Sex (Optional)</Text>
        
        {/* Row 1: Male, Female, Prefer not to say */}
        <View style={styles.miniChipsTray}>
          {([
            { id: 'male', label: 'Male' },
            { id: 'female', label: 'Female' },
            { id: 'prefer-not-say', label: 'Prefer not to say' },
          ]).map((option) => {
            const isSelected = optSex === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.miniChip, isSelected && styles.miniChipSelected]}
                onPress={() => setOptSex(option.id as BiologicalSex)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <Text style={[styles.miniChipLabel, isSelected && styles.miniChipLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Row 2: Other */}
        <View style={[styles.miniChipsTray, { marginTop: 8 }]}>
          {(() => {
            const isOtherSelected = optSex !== null && optSex !== undefined && optSex !== '' && optSex !== 'male' && optSex !== 'female' && optSex !== 'prefer-not-say';
            if (isOtherSelected) {
              return (
                <View style={styles.customSexExpandedContainer}>
                  <TextInput
                    style={styles.customSexExpandedInput}
                    placeholder="Specify biological sex..."
                    placeholderTextColor={palette.slateSubtle}
                    value={optSex === 'other' ? '' : (optSex ?? '')}
                    onChangeText={(text) => {
                      if (text === '') {
                        setOptSex('other');
                      } else {
                        setOptSex(text);
                      }
                    }}
                    autoFocus={true}
                    onSubmitEditing={handleCompleteWithOptionalData}
                    returnKeyType="done"
                  />
                  <Pressable
                    style={styles.customSexCloseButton}
                    onPress={() => setOptSex(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel other sex">
                    <X size={16} color={palette.slateMuted} />
                  </Pressable>
                </View>
              );
            }
            return (
              <Pressable
                style={styles.miniChip}
                onPress={() => setOptSex('other')}
                accessibilityRole="button"
                accessibilityState={{ selected: false }}>
                <Text style={styles.miniChipLabel}>Other</Text>
              </Pressable>
            );
          })()}
        </View>
      </View>

      {/* Weight & Height Row */}
      <View style={styles.inlineMetricsRow}>
        <View style={[styles.inlineInputGroup, { flex: 1 }]}>
          <Text style={styles.inlineInputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.inlineInputFieldBordered}
            placeholder="kg"
            placeholderTextColor={palette.slateSubtle}
            value={optWeight}
            onChangeText={(text) => setOptWeight(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            maxLength={5}
            onSubmitEditing={handleCompleteWithOptionalData}
            returnKeyType="done"
          />
        </View>

        <View style={[styles.inlineInputGroup, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.inlineInputLabel}>Height (cm)</Text>
          <TextInput
            style={styles.inlineInputFieldBordered}
            placeholder="cm"
            placeholderTextColor={palette.slateSubtle}
            value={optHeight}
            onChangeText={(text) => setOptHeight(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            maxLength={5}
            onSubmitEditing={handleCompleteWithOptionalData}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Action Buttons */}
      {(() => {
        const hasAnyDetail = !!(
          optName.trim() ||
          optAge.trim() ||
          (optSex !== null && optSex !== undefined && optSex !== '') ||
          optWeight.trim() ||
          optHeight.trim()
        );
        return (
          <View style={styles.biometricsActions}>
            {hasAnyDetail ? (
              <Pressable
                style={styles.generatePlanButton}
                onPress={handleCompleteWithOptionalData}
                accessibilityRole="button"
                accessibilityLabel="Generate your plan">
                <Text style={styles.generatePlanButtonText}>Generate your plan</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.generatePlanButton}
                onPress={() => handleComplete(finalExtractedProfile)}
                accessibilityRole="button"
                accessibilityLabel="Skip and generate plan">
                <Text style={styles.generatePlanButtonText}>Skip and generate plan</Text>
              </Pressable>
            )}
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  containerPhone: {
    paddingHorizontal: 16,
  },
  containerTablet: {
    paddingHorizontal: 28,
  },
  header: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.teal,
    letterSpacing: 0.5,
  },
  segmentedProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 20,
    gap: 12,
  },
  progressSegmentWrapper: {
    flex: 1,
  },
  progressSegmentTrack: {
    height: 6,
    backgroundColor: '#E2E8E6',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressSegmentFill: {
    height: '100%',
    backgroundColor: palette.teal,
    borderRadius: 3,
  },
  chatScroll: {
    flex: 1,
    width: '100%',
  },
  chatContent: {
    paddingBottom: 24,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    gap: 10,
    marginVertical: 6,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: palette.sageLight,
    borderBottomRightRadius: 4,
    maxWidth: '75%',
  },
  bubbleAssistant: {
    backgroundColor: palette.card,
    borderBottomLeftRadius: 4,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(14, 31, 26, 0.02)',
      },
      default: {
        shadowColor: '#0E1F1A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1,
      },
    }),
    maxWidth: '78%',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: palette.tealDark,
    fontWeight: '600',
  },
  textAssistant: {
    color: palette.slate,
    fontWeight: '500',
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    height: 12,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.slateSubtle,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderWidth: 1,
  },
  errorText: {
    color: palette.high,
    fontSize: 14,
  },
  initialScreen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  initialContainer: {
    flexGrow: 1,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  initialCenteredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  initialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  initialHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  initialHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loggedInHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarPlaceholderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  headerSignOutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'transparent',
  },
  headerSignOutText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slateMuted,
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.teal,
  },
  signupButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: palette.teal,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(42, 122, 114, 0.1)',
      },
      default: {
        shadowColor: palette.teal,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  initialLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialAppName: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.teal,
    letterSpacing: 1,
  },
  initialTextContainer: {
    marginBottom: 36,
    alignItems: 'center',
  },
  initialTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.slate,
    textAlign: 'center',
    marginBottom: 12,
  },
  initialSubtitle: {
    fontSize: 15,
    color: palette.slateSubtle,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  initialInputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 18,
    height: 60,
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(44, 51, 56, 0.04)',
      },
      default: {
        shadowColor: palette.slate,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      },
    }),
  },
  initialPillIconLeft: {
    marginRight: 12,
  },
  initialInputField: {
    flex: 1,
    fontSize: 16,
    color: palette.slate,
    height: '100%',
  },
  initialPillSend: {
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: '100%',
    minHeight: 52,
    ...Platform.select({
      web: { 
        boxShadow: '0px 2px 6px rgba(44, 51, 56, 0.02)',
      },
      default: {
        shadowColor: palette.slate,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
      },
    }),
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: palette.slate,
    paddingHorizontal: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: palette.border,
  },
  optionsContainer: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    marginTop: 8,
    ...cardShadow,
  },
  wizardBadge: {
    backgroundColor: palette.sageLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  wizardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.tealDark,
    letterSpacing: 1,
  },
  wizardHeader: {
    marginBottom: 20,
  },
  wizardQuestionText: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.slate,
    lineHeight: 28,
  },
  optionChip: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: palette.card,
  },
  optionChipSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  optionChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionChipText: {
    fontSize: 16,
    color: palette.slate,
    fontWeight: '600',
  },
  optionChipTextSelected: {
    color: palette.tealDark,
    fontWeight: '700',
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selectionIndicatorSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.teal,
  },
  inlineInputContainer: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: palette.background,
  },
  inlineInputField: {
    fontSize: 16,
    color: palette.slate,
  },
  wizardNavTray: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    gap: 12,
  },
  wizardBackButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardBackButtonText: {
    fontSize: 15,
    color: palette.tealDark,
    fontWeight: '700',
  },
  wizardNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: palette.teal,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 10px rgba(42, 122, 114, 0.15)',
      },
      default: {
        shadowColor: palette.teal,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  wizardNextButtonDisabled: {
    opacity: 0.4,
  },
  wizardNextButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  completeContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  showPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.teal,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(42, 122, 114, 0.15)',
      },
      default: {
        shadowColor: palette.teal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  showPlanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.slate,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 14,
    color: palette.slateMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  savingPromptRow: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  savingPromptText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate,
    textAlign: 'center',
  },
  savingActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  savingActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: palette.teal,
  },
  savingActionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  savingActionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  savingActionButtonTextDisabled: {
    color: palette.slateMuted,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  openQuestionContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  biometricsCard: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    marginTop: 8,
    marginBottom: 20,
    ...cardShadow,
  },
  biometricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  biometricsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.teal,
  },
  biometricsBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  biometricsSubtitle: {
    fontSize: 14,
    color: palette.slateSubtle,
    lineHeight: 20,
    marginBottom: 20,
  },
  inlineInputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  inlineInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slateMuted,
    marginBottom: 6,
  },
  inlineInputFieldBordered: {
    backgroundColor: palette.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: palette.slate,
    height: 48,
    width: '100%',
  },
  miniChipsTray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  miniChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
  },
  miniChipSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.sageLight,
  },
  miniChipLabel: {
    fontSize: 13,
    color: palette.slateMuted,
    fontWeight: '500',
  },
  miniChipLabelSelected: {
    color: palette.tealDark,
    fontWeight: '700',
  },
  customSexContainerInline: {
    marginTop: 10,
    backgroundColor: palette.background,
    borderRadius: 12,
    padding: 12,
  },
  customSexLabelInline: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slateMuted,
    marginBottom: 6,
  },
  customSexInputInline: {
    fontSize: 16,
    color: palette.slate,
    paddingVertical: 4,
  },
  customSexExpandedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.teal,
    paddingHorizontal: 12,
    height: 48,
    width: '100%',
  },
  customSexExpandedInput: {
    flex: 1,
    fontSize: 16,
    color: palette.slate,
    paddingVertical: 8,
  },
  customSexCloseButton: {
    padding: 6,
    marginLeft: 8,
  },
  inlineMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  biometricsActions: {
    marginTop: 12,
    gap: 12,
    width: '100%',
  },
  generatePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.teal,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(42, 122, 114, 0.15)',
      },
      default: {
        shadowColor: palette.teal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  generatePlanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipPlanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  skipPlanButtonText: {
    color: palette.slateMuted,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  placeholderContainer: {
    position: 'absolute',
    left: 50,
    right: 58,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderText: {
    fontSize: 16,
    color: palette.slateSubtle,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Standard darkened backdrop overlay
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: palette.card, // Solid card background
    borderRadius: 24, // Matches standard cards in the app
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 12px 24px rgba(14, 31, 26, 0.05)',
      },
      default: {
        shadowColor: '#0E1F1A', // Matches existing biometricsCard shadow
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
        elevation: 4,
      },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.slate,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: palette.slateMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOptions: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  modalOptionButtonActive: {
    backgroundColor: palette.teal, // Solid teal button matching onboarding next/guest buttons
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(42, 122, 114, 0.15)',
      },
      default: {
        shadowColor: palette.teal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  modalOptionTextActive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOptionButtonDisabled: {
    backgroundColor: palette.background, // Standard background color card
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    opacity: 0.5,
  },
  modalOptionTextDisabled: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.slateMuted,
  },
  modalCloseButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slateMuted,
    textDecorationLine: 'underline',
  },
});