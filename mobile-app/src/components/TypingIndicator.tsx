import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

const TypingIndicator: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <ActivityIndicator size="small" color="#58a6ff" />
        <Text style={styles.text}>Thinking...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    marginHorizontal: 12,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#21262d',
    gap: 10,
    marginLeft: 36,
  },
  text: {
    color: '#58a6ff',
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default React.memo(TypingIndicator);
