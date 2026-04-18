import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {MODEL_CATALOG} from '../types';

interface ModelStatusBarProps {
  isLoaded: boolean;
  isLoading: boolean;
  contextSize: number;
  modelId?: string | null;
}

const ModelStatusBar: React.FC<ModelStatusBarProps> = ({isLoaded, isLoading, contextSize, modelId}) => {
  const navigation = useNavigation<any>();
  const catalogEntry = modelId ? MODEL_CATALOG.find(m => m.id === modelId) : null;

  if (!isLoaded && !isLoading) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => navigation.navigate('Settings')}
        activeOpacity={0.7}>
        <View style={[styles.indicator, styles.indicatorRed]} />
        <Text style={styles.statusText}>
          Model not loaded — tap to set up
        </Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  }

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
          {catalogEntry ? `${catalogEntry.name} • ` : ''}Model ready • {contextSize} ctx
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
    flex: 1,
  },
  arrow: {
    color: '#666',
    fontSize: 18,
    marginLeft: 8,
  },
});

export default React.memo(ModelStatusBar);
