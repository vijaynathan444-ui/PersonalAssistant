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
          <ActivityIndicator size="small" color="#58a6ff" />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  indicatorGreen: {
    backgroundColor: '#3fb950',
    shadowColor: '#3fb950',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  indicatorRed: {
    backgroundColor: '#f85149',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#7d8590',
    fontSize: 12,
    flex: 1,
  },
  arrow: {
    color: '#484f58',
    fontSize: 18,
    marginLeft: 8,
  },
});

export default React.memo(ModelStatusBar);
