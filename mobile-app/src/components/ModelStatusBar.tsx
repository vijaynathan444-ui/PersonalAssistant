import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

interface ModelStatusBarProps {
  isLoaded: boolean;
  isLoading: boolean;
  contextSize: number;
}

const ModelStatusBar: React.FC<ModelStatusBarProps> = ({isLoaded, isLoading, contextSize}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.indicator, isLoaded ? styles.indicatorGreen : styles.indicatorRed]} />
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#82aaff" />
          <Text style={styles.statusText}>Loading model...</Text>
        </View>
      ) : (
        <Text style={styles.statusText}>
          {isLoaded ? `Model ready • ${contextSize} ctx` : 'Model not loaded'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0f0f23',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  indicatorGreen: {
    backgroundColor: '#4caf50',
  },
  indicatorRed: {
    backgroundColor: '#f44336',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#999',
    fontSize: 12,
  },
});

export default React.memo(ModelStatusBar);
