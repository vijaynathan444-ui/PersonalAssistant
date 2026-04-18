import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {pick, types} from 'react-native-document-picker';
import {useAppStore} from '../store/useAppStore';
import {useLLM} from '../hooks/useLLM';
import llmService from '../services/LLMService';
import securityService from '../services/SecurityService';
import ModelSelector from '../components/ModelSelector';
import {MODEL_CATALOG, ModelCatalogEntry} from '../types';

const SettingsScreen: React.FC = () => {
  const {settings, updateSettings} = useAppStore();
  const {modelInfo, loadModel, switchModel, unloadModel, isModelLoading, getMemoryInfo} = useLLM();

  const [modelPath, setModelPath] = useState(settings.modelConfig.modelPath);
  const [contextSize, setContextSize] = useState(String(settings.modelConfig.contextSize));
  const [threads, setThreads] = useState(String(settings.modelConfig.threads));
  const [maxTokens, setMaxTokens] = useState(String(settings.modelConfig.maxTokens));
  const [retrievalTopK, setRetrievalTopK] = useState(String(settings.retrievalTopK));
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [isCopying, setIsCopying] = useState(false);

  const handleSelectCatalogModel = useCallback(async (entry: ModelCatalogEntry) => {
    // Update settings with catalog model defaults
    setContextSize(String(entry.contextWindow));
    setThreads(String(entry.defaultThreads));
    setMaxTokens(String(entry.defaultMaxTokens));
    updateSettings({
      modelConfig: {
        ...settings.modelConfig,
        selectedModelId: entry.id,
        contextSize: entry.contextWindow,
        threads: entry.defaultThreads,
        maxTokens: entry.defaultMaxTokens,
      },
    });

    // Switch model (unloads current, loads new)
    await switchModel(entry);
  }, [settings, switchModel, updateSettings]);

  const handlePickModel = async () => {
    try {
      const [result] = await pick({
        type: [types.allFiles],
      });

      if (!result || !result.uri) return;

      const fileName = result.name || 'model.gguf';
      if (!fileName.endsWith('.gguf')) {
        Alert.alert('Invalid File', 'Please select a .gguf model file.');
        return;
      }

      setIsCopying(true);
      try {
        const destPath = await llmService.copyModelToAppDir(result.uri, fileName);
        setModelPath(destPath);
        updateSettings({
          modelConfig: {
            ...settings.modelConfig,
            modelPath: destPath,
          },
        });
        Alert.alert(
          'Model Imported',
          `Model copied to app storage.\nPath: ${destPath}\n\nTap "Reload Model" to load it.`,
        );
      } finally {
        setIsCopying(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('cancel')) {
        Alert.alert('Error', `Failed to import model: ${message}`);
      }
    }
  };

  const handleSaveModelConfig = () => {
    const ctx = parseInt(contextSize, 10);
    const thr = parseInt(threads, 10);
    const max = parseInt(maxTokens, 10);
    const retrieval = parseInt(retrievalTopK, 10);

    if (isNaN(ctx) || ctx < 128 || ctx > 8192) {
      Alert.alert('Invalid', 'Context size must be between 128 and 8192');
      return;
    }
    if (isNaN(thr) || thr < 1 || thr > 16) {
      Alert.alert('Invalid', 'Threads must be between 1 and 16');
      return;
    }
    if (isNaN(max) || max < 32 || max > 4096) {
      Alert.alert('Invalid', 'Max tokens must be between 32 and 4096');
      return;
    }
    if (isNaN(retrieval) || retrieval < 1 || retrieval > 8) {
      Alert.alert('Invalid', 'Retrieved source count must be between 1 and 8');
      return;
    }

    updateSettings({
      modelConfig: {
        modelPath,
        contextSize: ctx,
        threads: thr,
        maxTokens: max,
        selectedModelId: settings.modelConfig.selectedModelId,
      },
      retrievalTopK: retrieval,
      systemPrompt,
    });

    Alert.alert('Saved', 'Settings have been saved. Reload model to apply changes.');
  };

  const handleSecurityCheck = async () => {
    try {
      const result = await securityService.checkDeviceSecurity();
      Alert.alert(
        'Security Check',
        `Rooted: ${result.isRooted ? 'YES ⚠️' : 'No ✅'}\n` +
          `Emulator: ${result.isEmulator ? 'YES ⚠️' : 'No ✅'}\n` +
          `Debugger: ${result.isDebuggerAttached ? 'YES ⚠️' : 'No ✅'}\n` +
          `\nOverall: ${result.secure ? 'SECURE ✅' : 'WARNINGS DETECTED ⚠️'}`,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to run security check');
    }
  };

  const handleReloadModel = async () => {
    handleSaveModelConfig();
    await unloadModel();
    await loadModel();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Model Selector Dropdown */}
        <Text style={styles.sectionTitle}>AI Model</Text>
        <View style={styles.card}>
          <ModelSelector
            selectedModelId={settings.modelConfig.selectedModelId}
            onSelectModel={handleSelectCatalogModel}
            isLoading={isModelLoading}
            loadedModelId={modelInfo?.modelId}
          />
        </View>

        {/* Model Configuration */}
        <Text style={styles.sectionTitle}>Advanced Configuration</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Model Path</Text>
          <TextInput
            style={styles.input}
            value={modelPath}
            onChangeText={setModelPath}
            placeholder="/data/local/tmp/models/model.gguf"
            placeholderTextColor="#555"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, {marginTop: 8}]}
            onPress={handlePickModel}
            disabled={isCopying}>
            {isCopying ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.buttonText, {marginLeft: 8}]}>Copying model...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>📂 Pick Model File (.gguf)</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.hintText}>
            Place .gguf model files on your device storage, then use the button above to import them. All models run 100% locally on-device.
          </Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Context Size</Text>
              <TextInput
                style={styles.input}
                value={contextSize}
                onChangeText={setContextSize}
                keyboardType="numeric"
                placeholderTextColor="#555"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Threads</Text>
              <TextInput
                style={styles.input}
                value={threads}
                onChangeText={setThreads}
                keyboardType="numeric"
                placeholderTextColor="#555"
              />
            </View>
          </View>

          <Text style={styles.label}>Max Tokens</Text>
          <TextInput
            style={styles.input}
            value={maxTokens}
            onChangeText={setMaxTokens}
            keyboardType="numeric"
            placeholderTextColor="#555"
          />

          <Text style={styles.label}>Retrieved Sources</Text>
          <TextInput
            style={styles.input}
            value={retrievalTopK}
            onChangeText={setRetrievalTopK}
            keyboardType="numeric"
            placeholderTextColor="#555"
          />
        </View>

        {/* System Prompt */}
        <Text style={styles.sectionTitle}>System Prompt</Text>
        <View style={styles.card}>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            multiline
            numberOfLines={4}
            placeholderTextColor="#555"
          />
        </View>

        {/* Voice Settings */}
        <Text style={styles.sectionTitle}>Voice</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Voice Enabled</Text>
            <Switch
              value={settings.voiceEnabled}
              onValueChange={(val) => updateSettings({voiceEnabled: val})}
              trackColor={{false: '#333', true: '#0a84ff'}}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Allow Web Access</Text>
            <Switch
              value={settings.webAccessEnabled}
              onValueChange={(val) => updateSettings({webAccessEnabled: val})}
              trackColor={{false: '#333', true: '#0a84ff'}}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Model Status */}
        <Text style={styles.sectionTitle}>Model Status</Text>
        <View style={styles.card}>
          <Text style={styles.statusText}>
            Status: {modelInfo?.loaded ? '🟢 Loaded' : '🔴 Not Loaded'}
          </Text>
          {modelInfo?.loaded && (
            <Text style={styles.statusText}>
              Context: {modelInfo.contextSize} tokens
            </Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleReloadModel}
              disabled={isModelLoading}>
              <Text style={styles.buttonText}>
                {isModelLoading ? 'Loading...' : 'Reload Model'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={unloadModel}
              disabled={!modelInfo?.loaded}>
              <Text style={styles.buttonText}>Unload</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSaveModelConfig}>
            <Text style={styles.buttonText}>Save Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, {marginTop: 10}]}
            onPress={handleSecurityCheck}>
            <Text style={styles.buttonText}>Run Security Check</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.infoText}>LocalAI Assistant v1.0.0</Text>
          <Text style={styles.infoText}>Fully offline AI personal assistant</Text>
          <Text style={styles.infoText}>Powered by llama.cpp</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#82aaff',
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  label: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0a84ff',
  },
  secondaryButton: {
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#444',
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  hintText: {
    color: '#666',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SettingsScreen;
