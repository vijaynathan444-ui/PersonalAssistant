import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Markdown from 'react-native-markdown-display';
import type {ChatMessage} from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

const markdownStyles = {
  body: {color: '#c9d1d9', fontSize: 15},
  code_inline: {
    backgroundColor: '#1b2430',
    color: '#79c0ff',
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: '#0d1117',
    padding: 12,
    borderRadius: 8,
    color: '#79c0ff',
  },
  link: {color: '#58a6ff'},
  heading1: {color: '#e6edf3', fontSize: 20, fontWeight: 'bold' as const},
  heading2: {color: '#e6edf3', fontSize: 18, fontWeight: 'bold' as const},
  strong: {color: '#e6edf3'},
};

const ChatBubble: React.FC<ChatBubbleProps> = ({message}) => {
  const isUser = message.role === 'user';
  const citations = message.citations ?? [];

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={styles.bubbleRow}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {isUser ? (
            <Text style={styles.userText}>{message.content}</Text>
          ) : (
            <Markdown style={markdownStyles}>{message.content}</Markdown>
          )}
        </View>
        {isUser && (
          <View style={[styles.avatar, styles.userAvatar]}>
            <Text style={styles.avatarText}>You</Text>
          </View>
        )}
      </View>
      {!isUser && citations.length > 0 && (
        <View style={styles.citationsRow}>
          {citations.map(citation => (
            <View key={`${message.id}_${citation.itemId}`} style={styles.citationChip}>
              <Text style={styles.citationText}>{citation.title}</Text>
            </View>
          ))}
        </View>
      )}
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
    marginVertical: 6,
    marginHorizontal: 12,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  userAvatar: {
    backgroundColor: '#1f6feb',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e6edf3',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#1f6feb',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#161b22',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  userText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 21,
  },
  timestamp: {
    fontSize: 11,
    color: '#484f58',
    marginTop: 3,
  },
  citationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    maxWidth: '85%',
    marginLeft: 36,
  },
  citationChip: {
    backgroundColor: '#0d2d4d',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1f6feb44',
  },
  citationText: {
    color: '#58a6ff',
    fontSize: 11,
  },
  timestampRight: {
    marginRight: 36,
  },
  timestampLeft: {
    marginLeft: 36,
  },
});

export default React.memo(ChatBubble);
