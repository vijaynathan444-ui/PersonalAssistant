import React, {useState, useCallback} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  onMicPress: () => void;
  isGenerating: boolean;
  isListening: boolean;
  voiceEnabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onMicPress,
  isGenerating,
  isListening,
  voiceEnabled,
}) => {
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || isGenerating) return;
    onSend(trimmed);
    setText('');
  }, [text, isGenerating, onSend]);

  return (
    <View style={styles.container}>
      {voiceEnabled && (
        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={onMicPress}
          disabled={isGenerating}
          accessibilityLabel="Voice input"
          accessibilityRole="button">
          <Text style={styles.micIcon}>{isListening ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor="#666"
        multiline
        maxLength={5000}
        editable={!isGenerating}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        accessibilityLabel="Message input"
      />

      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || isGenerating) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || isGenerating}
        accessibilityLabel="Send message"
        accessibilityRole="button">
        {isGenerating ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.sendIcon}>➤</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a4a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0a84ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 18,
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2a2a4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#e53935',
  },
  micIcon: {
    fontSize: 18,
  },
});

export default React.memo(ChatInput);
