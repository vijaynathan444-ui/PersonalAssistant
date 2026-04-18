import React, {useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppStore} from '../store/useAppStore';
import type {ChatSession} from '../types';
import type {RootStackParamList} from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatHistory'>;

const ChatHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {conversations, activeConversationId, switchConversation, deleteConversation, createConversation} = useAppStore();

  const handleNewChat = useCallback(() => {
    createConversation();
    navigation.navigate('Chat');
  }, [createConversation, navigation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      switchConversation(id);
      navigation.navigate('Chat', {conversationId: id});
    },
    [switchConversation, navigation],
  );

  const handleDelete = useCallback(
    (id: string, title: string) => {
      Alert.alert('Delete Chat', `Delete "${title}"?`, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(id),
        },
      ]);
    },
    [deleteConversation],
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    }
    if (days === 1) {return 'Yesterday';}
    if (days < 7) {return `${days}d ago`;}
    return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
  };

  const renderItem = useCallback(
    ({item}: {item: ChatSession}) => {
      const isActive = item.id === activeConversationId;
      return (
        <TouchableOpacity
          style={[styles.conversationCard, isActive && styles.activeCard]}
          onPress={() => handleSelectConversation(item.id)}
          onLongPress={() => handleDelete(item.id, item.title)}
          activeOpacity={0.7}>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardDate}>{formatDate(item.updatedAt)}</Text>
            </View>
            {item.preview ? (
              <Text style={styles.cardPreview} numberOfLines={2}>
                {item.preview}
              </Text>
            ) : null}
            <View style={styles.cardFooter}>
              <Text style={styles.cardMeta}>
                {item.messageCount} message{item.messageCount !== 1 ? 's' : ''}
              </Text>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [activeConversationId, handleSelectConversation, handleDelete],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat} activeOpacity={0.8}>
        <Text style={styles.newChatIcon}>+</Text>
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a new chat to begin a conversation
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#238636',
    gap: 8,
  },
  newChatIcon: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '600',
  },
  newChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  conversationCard: {
    backgroundColor: '#161b22',
    borderRadius: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#21262d',
    overflow: 'hidden',
  },
  activeCard: {
    borderColor: '#388bfd',
    backgroundColor: '#0d1f3c',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6edf3',
    flex: 1,
    marginRight: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#7d8590',
  },
  cardPreview: {
    fontSize: 13,
    color: '#7d8590',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    fontSize: 12,
    color: '#484f58',
  },
  activeBadge: {
    backgroundColor: '#388bfd22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    color: '#388bfd',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e6edf3',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7d8590',
    textAlign: 'center',
  },
});

export default ChatHistoryScreen;
