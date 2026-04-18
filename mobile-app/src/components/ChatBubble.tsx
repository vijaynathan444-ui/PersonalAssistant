import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Markdown from 'react-native-markdown-display';
import type {ChatMessage} from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

const markdownStyles = {
  body: {color: '#e0e0e0', fontSize: 15},
  code_inline: {
    backgroundColor: '#2a2a4a',
    color: '#82aaff',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  code_block: {
    backgroundColor: '#1a1a3e',
    padding: 10,
    borderRadius: 6,
    color: '#82aaff',
  },
  link: {color: '#64b5f6'},
  heading1: {color: '#ffffff', fontSize: 20, fontWeight: 'bold' as const},
  heading2: {color: '#ffffff', fontSize: 18, fontWeight: 'bold' as const},
  strong: {color: '#ffffff'},
};

const ChatBubble: React.FC<ChatBubbleProps> = ({message}) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{message.content}</Markdown>
        )}
      </View>
      <Text style={[styles.timestamp, isUser ? styles.timestampRight : styles.timestampLeft]}>
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#0a84ff',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#2a2a4a',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  timestampRight: {
    marginRight: 4,
  },
  timestampLeft: {
    marginLeft: 4,
  },
});

export default React.memo(ChatBubble);
