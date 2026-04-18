import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

const TypingIndicator: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <ActivityIndicator size="small" color="#82aaff" />
        <Text style={styles.text}>Thinking...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    gap: 8,
  },
  text: {
    color: '#82aaff',
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default React.memo(TypingIndicator);
