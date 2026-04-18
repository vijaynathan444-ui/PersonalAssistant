import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {MODEL_CATALOG, ModelCatalogEntry} from '../types';

interface ModelSelectorProps {
  selectedModelId: string | null;
  onSelectModel: (entry: ModelCatalogEntry) => void;
  isLoading: boolean;
  loadedModelId?: string | null;
}

const TIER_COLORS: Record<string, string> = {
  lightweight: '#4CAF50',
  balanced: '#2196F3',
  performance: '#FF9800',
  premium: '#E91E63',
};

const RISK_COLORS: Record<string, string> = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
};

const CATEGORY_ICONS: Record<string, string> = {
  general: '🌐',
  coding: '💻',
  reasoning: '🧠',
  chat: '💬',
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  isLoading,
  loadedModelId,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const bundledModels = MODEL_CATALOG
    .filter(m => m.bundled)
    .sort((a, b) => a.rank - b.rank);

  const selectedModel =
    MODEL_CATALOG.find(m => m.id === selectedModelId && m.bundled) ?? bundledModels[0];
  const loadedModel = MODEL_CATALOG.find(m => m.id === loadedModelId);
  const displayModel = loadedModel ?? selectedModel;

  const handleSelect = useCallback(
    (entry: ModelCatalogEntry) => {
      setModalVisible(false);
      onSelectModel(entry);
    },
    [onSelectModel],
  );

  const sortedModels = bundledModels.length > 0 ? bundledModels : [...MODEL_CATALOG].sort((a, b) => a.rank - b.rank);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Model Selection</Text>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
        disabled={isLoading}
        activeOpacity={0.7}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading model...</Text>
          </View>
        ) : displayModel ? (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedName}>{displayModel.name}</Text>
            <View style={[styles.tierBadge, {backgroundColor: TIER_COLORS[displayModel.tier]}]}>
              <Text style={styles.tierText}>{displayModel.tier}</Text>
            </View>
            <Text style={styles.chevron}>▼</Text>
          </View>
        ) : (
          <View style={styles.selectedRow}>
            <Text style={styles.placeholderText}>Bundled model only</Text>
            <Text style={styles.chevron}>▼</Text>
          </View>
        )}
      </TouchableOpacity>

      {loadedModel && (
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            {CATEGORY_ICONS[loadedModel.category]} {loadedModel.parameters} · {loadedModel.sizeGB}GB · {loadedModel.contextWindow} ctx
          </Text>
          <View style={styles.riskRow}>
            <Text style={styles.infoText}>Hallucination: </Text>
            <View style={[styles.riskDot, {backgroundColor: RISK_COLORS[loadedModel.hallucinationRisk]}]} />
            <Text style={[styles.riskText, {color: RISK_COLORS[loadedModel.hallucinationRisk]}]}>
              {loadedModel.hallucinationRisk}
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Model</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Only bundled local models are available in this build
            </Text>
            <ScrollView style={styles.modelList} showsVerticalScrollIndicator={false}>
              {sortedModels.map(model => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelCard,
                    loadedModelId === model.id && styles.modelCardActive,
                  ]}
                  onPress={() => handleSelect(model)}
                  activeOpacity={0.7}>
                  <View style={styles.modelCardHeader}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{model.rank}</Text>
                    </View>
                    <Text style={styles.modelName}>{model.name}</Text>
                    <View
                      style={[
                        styles.tierBadge,
                        {backgroundColor: TIER_COLORS[model.tier]},
                      ]}>
                      <Text style={styles.tierText}>{model.tier}</Text>
                    </View>
                  </View>

                  <Text style={styles.modelDesc}>{model.description}</Text>

                  <View style={styles.modelStats}>
                    <Text style={styles.statText}>
                      {CATEGORY_ICONS[model.category]} {model.parameters}
                    </Text>
                    <Text style={styles.statText}>📦 {model.sizeGB}GB</Text>
                    <Text style={styles.statText}>🧠 {model.minRAMGB}GB+ RAM</Text>
                    <Text style={styles.statText}>📝 {model.contextWindow} ctx</Text>
                  </View>

                  <View style={styles.modelFooter}>
                    <View style={styles.strengthsRow}>
                      {model.strengths.slice(0, 3).map((s, i) => (
                        <View key={i} style={styles.strengthBadge}>
                          <Text style={styles.strengthText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.riskRow}>
                      <View
                        style={[
                          styles.riskDot,
                          {backgroundColor: RISK_COLORS[model.hallucinationRisk]},
                        ]}
                      />
                      <Text
                        style={[
                          styles.riskText,
                          {color: RISK_COLORS[model.hallucinationRisk]},
                        ]}>
                        {model.hallucinationRisk} hallucination
                      </Text>
                    </View>
                  </View>

                  {model.bundled && (
                    <View style={styles.bundledBadge}>
                      <Text style={styles.bundledText}>📦 BUNDLED</Text>
                    </View>
                  )}

                  {loadedModelId === model.id && (
                    <View style={styles.loadedBadge}>
                      <Text style={styles.loadedText}>● LOADED</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  selectorButton: {
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  placeholderText: {
    color: '#888888',
    fontSize: 16,
    flex: 1,
  },
  chevron: {
    color: '#6C63FF',
    fontSize: 14,
    marginLeft: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginLeft: 10,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  tierText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  infoText: {
    color: '#888888',
    fontSize: 12,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E22',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    color: '#888888',
    fontSize: 22,
    padding: 4,
  },
  modalSubtitle: {
    color: '#888888',
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modelList: {
    paddingHorizontal: 16,
  },
  modelCard: {
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  modelCardActive: {
    borderColor: '#6C63FF',
    borderWidth: 2,
  },
  modelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankBadge: {
    backgroundColor: '#3A3A3E',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '700',
  },
  modelName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  modelDesc: {
    color: '#AAAAAA',
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  modelStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  statText: {
    color: '#888888',
    fontSize: 11,
  },
  modelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  strengthBadge: {
    backgroundColor: '#1A1A1E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  strengthText: {
    color: '#6C63FF',
    fontSize: 10,
  },
  loadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  loadedText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '700',
  },
  bundledBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  bundledText: {
    color: '#FF9800',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ModelSelector;
