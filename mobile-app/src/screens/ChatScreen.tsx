import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';

import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import ModelStatusBar from '../components/ModelStatusBar';
import TypingIndicator from '../components/TypingIndicator';
import {useLLM} from '../hooks/useLLM';
import {useVoice} from '../hooks/useVoice';
import {useAppStore} from '../store/useAppStore';
import type {ChatMessage} from '../types';
import type {RootStackParamList} from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const {loadPersistedState, projects, activeProjectId, knowledgeItems} = useAppStore();

  const {
    messages,
    isGenerating,
    modelInfo,
    isModelLoading,
    loadModel,
    sendMessage,
  } = useLLM();

  const {
    isListening,
    isSpeaking,
    voiceEnabled,
    speak,
    stopSpeaking,
    requestPermission,
  } = useVoice();

  // Load persisted state and model on mount
  useEffect(() => {
    loadPersistedState();
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Configure header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Clear Chat',
                'Are you sure you want to clear all messages?',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => useAppStore.getState().clearMessages(),
                  },
                ],
              );
            }}
            style={styles.headerButton}
            accessibilityLabel="Clear chat">
            <Text style={styles.headerButtonText}>🗑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Knowledge')}
            style={styles.headerButton}
            accessibilityLabel="Project memory">
            <Text style={styles.headerButtonText}>📚</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerButton}
            accessibilityLabel="Settings">
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!modelInfo?.loaded) {
        Alert.alert('Model Not Ready', 'Please wait for the model to load.');
        return;
      }

      const response = await sendMessage(text);

      // Speak the response if voice is enabled
      if (response && voiceEnabled) {
        await speak(response);
      }
    },
    [modelInfo, sendMessage, voiceEnabled, speak],
  );

  const handleMicPress = useCallback(async () => {
    if (isSpeaking) {
      await stopSpeaking();
      return;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is needed for voice input.',
      );
      return;
    }

    // TODO: Integrate Vosk real-time STT here
    Alert.alert(
      'Voice Input',
      'Push-to-talk: Vosk STT integration point.\nSpeak your message and it will be transcribed.',
    );
  }, [isSpeaking, stopSpeaking, requestPermission]);

  const renderItem = useCallback(
    ({item}: {item: ChatMessage}) => <ChatBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);
  const activeProject = projects.find(project => project.id === activeProjectId) ?? null;
  const activeProjectSources = knowledgeItems.filter(
    item => item.projectId === activeProjectId,
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ModelStatusBar
        isLoaded={modelInfo?.loaded ?? false}
        isLoading={isModelLoading}
        contextSize={modelInfo?.contextSize ?? 0}
        modelId={modelInfo?.modelId}
      />

      {activeProject ? (
        <TouchableOpacity
          style={styles.projectBanner}
          onPress={() => navigation.navigate('Knowledge')}
          accessibilityLabel="Open project memory">
          <View>
            <Text style={styles.projectBannerLabel}>Active memory</Text>
            <Text style={styles.projectBannerTitle}>{activeProject.name}</Text>
            <Text style={styles.projectBannerSubtitle}>
              {activeProjectSources} indexed sources available for retrieval
            </Text>
          </View>
          <Text style={styles.projectBannerArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.projectBanner, styles.projectBannerEmpty]}
          onPress={() => navigation.navigate('Knowledge')}
          accessibilityLabel="Create project memory">
          <View>
            <Text style={styles.projectBannerLabel}>Project memory</Text>
            <Text style={styles.projectBannerTitle}>Create your first project</Text>
            <Text style={styles.projectBannerSubtitle}>
              Import files or web pages so chat answers can use your saved context.
            </Text>
          </View>
          <Text style={styles.projectBannerArrow}>＋</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyTitle}>LocalAI Assistant</Text>
            {!modelInfo?.loaded && !isModelLoading ? (
              <View>
                <Text style={styles.emptySubtitle}>
                  No model loaded yet.{'\n'}
                  Go to Settings → Pick a .gguf model file to get started.
                </Text>
                <TouchableOpacity
                  style={styles.setupButton}
                  onPress={() => navigation.navigate('Settings')}>
                  <Text style={styles.setupButtonText}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.emptySubtitle}>
                Fully offline AI running on your device.{'\n'}
                Type a message or use voice input.
              </Text>
            )}
          </View>
        }
        ListFooterComponent={isGenerating ? <TypingIndicator /> : null}
      />

      <ChatInput
        onSend={handleSend}
        onMicPress={handleMicPress}
        isGenerating={isGenerating}
        isListening={isListening}
        voiceEnabled={voiceEnabled}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 18,
  },
  messageList: {
    flex: 1,
  },
  projectBanner: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#1d3a53',
    borderWidth: 1,
    borderColor: '#345c7f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectBannerEmpty: {
    backgroundColor: '#2c244a',
    borderColor: '#4d4180',
  },
  projectBannerLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#9fd7ff',
    marginBottom: 4,
  },
  projectBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  projectBannerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#c1d6ea',
    maxWidth: 280,
  },
  projectBannerArrow: {
    fontSize: 28,
    color: '#ffffff',
  },
  messageContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  setupButton: {
    marginTop: 16,
    backgroundColor: '#0a84ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  setupButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default ChatScreen;
