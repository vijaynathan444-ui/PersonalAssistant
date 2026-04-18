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
        placeholderTextColor="#484f58"
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0d1117',
    borderTopWidth: 1,
    borderTopColor: '#21262d',
  },
  input: {
    flex: 1,
    backgroundColor: '#161b22',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    color: '#e6edf3',
    fontSize: 15,
    maxHeight: 100,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#238636',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#21262d',
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 18,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161b22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262d',
  },
  micButtonActive: {
    backgroundColor: '#da3633',
    borderColor: '#da3633',
  },
  micIcon: {
    fontSize: 18,
  },
});

export default React.memo(ChatInput);
