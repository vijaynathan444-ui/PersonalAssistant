import {useCallback} from 'react';
import {Alert} from 'react-native';
import RNFS from 'react-native-fs';
import {useAppStore} from '../store/useAppStore';
import llmService from '../services/LLMService';
import promptService from '../services/PromptService';
import knowledgeService from '../services/KnowledgeService';
import type {ChatMessage, ModelCatalogEntry} from '../types';
import {MODEL_CATALOG} from '../types';

export function useLLM() {
  const {
    messages,
    isGenerating,
    modelInfo,
    isModelLoading,
    settings,
    projects,
    activeProjectId,
    knowledgeItems,
    knowledgeChunks,
    addMessage,
    setIsGenerating,
    setModelInfo,
    setIsModelLoading,
  } = useAppStore();

  const loadModel = useCallback(async (catalogEntry?: ModelCatalogEntry): Promise<boolean> => {
    setIsModelLoading(true);
    try {
      const {modelConfig} = settings;
      let modelPath = modelConfig.modelPath;
      let contextSize = modelConfig.contextSize;
      let threads = modelConfig.threads;

      // If loading from catalog, use catalog model settings
      if (catalogEntry) {
        const appModelDir = await llmService.getAppModelDir();
        modelPath = `${appModelDir}/${catalogEntry.fileName}`;
        contextSize = catalogEntry.contextWindow;
        threads = catalogEntry.defaultThreads;

        // Check if model file exists
        const exists = await RNFS.exists(modelPath);
        if (!exists) {
          // If this is a bundled model, extract from assets first
          if (catalogEntry.bundled) {
            try {
              modelPath = await llmService.extractBundledModel(
                catalogEntry.fileName,
                catalogEntry.fileName,
              );
            } catch (extractErr) {
              Alert.alert(
                'Extraction Failed',
                `Could not extract bundled model "${catalogEntry.name}".\n\n${extractErr instanceof Error ? extractErr.message : String(extractErr)}`,
              );
              setIsModelLoading(false);
              return false;
            }
          } else {
            Alert.alert(
              'Model Not Found',
              `"${catalogEntry.name}" is not available locally.\n\nExpected file: ${catalogEntry.fileName}\nSize: ${catalogEntry.sizeGB} GB\n\nUse "Pick Model File" in Settings to import a .gguf model from your device storage.`,
            );
            setIsModelLoading(false);
            return false;
          }
        }

        // Memory check
        if (catalogEntry.minRAMGB > 6) {
          Alert.alert(
            'High Memory Model',
            `"${catalogEntry.name}" requires ${catalogEntry.minRAMGB}GB+ RAM. If the app crashes, try a smaller model.`,
          );
        }

        // Set prompt template for this model
        promptService.setPromptTemplate(catalogEntry.promptTemplate);
        llmService.setCurrentModelId(catalogEntry.id);
      } else {
        // Auto-detect: if selectedModelId is set, load that catalog model
        if (modelConfig.selectedModelId) {
          const savedEntry = MODEL_CATALOG.find(m => m.id === modelConfig.selectedModelId);
          if (savedEntry) {
            setIsModelLoading(false);
            return loadModel(savedEntry);
          }
        }

        // Fallback: try app-scoped model directory
        if (!modelPath) {
          try {
            const appModelDir = await llmService.getAppModelDir();
            const appModelPath = `${appModelDir}/model.gguf`;
            const exists = await RNFS.exists(appModelPath);
            if (exists) {
              modelPath = appModelPath;
            }
          } catch {
            // Fall through to try the original path
          }
        }
        promptService.setPromptTemplate('chatml');
      }

      const info = await llmService.loadModel(modelPath, contextSize, threads);
      setModelInfo({...info, modelId: catalogEntry?.id});
      promptService.setSystemPrompt(settings.systemPrompt);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load model:', message);
      setModelInfo(null);

      if (message.includes('MODEL_NOT_FOUND') || message.includes('not found')) {
        Alert.alert(
          'Model Not Found',
          'No model file found. Go to Settings and use "Pick Model File" to import a .gguf model from your device storage.',
        );
      } else {
        Alert.alert('Model Load Failed', message);
      }
      return false;
    } finally {
      setIsModelLoading(false);
    }
  }, [settings, setIsModelLoading, setModelInfo]);

  const switchModel = useCallback(async (catalogEntry: ModelCatalogEntry): Promise<boolean> => {
    // Unload current model first to free memory
    if (modelInfo?.loaded) {
      await llmService.unloadModel();
      setModelInfo(null);
    }
    return loadModel(catalogEntry);
  }, [modelInfo, loadModel, setModelInfo]);

  const sendMessage = useCallback(
    async (text: string): Promise<string | null> => {
      if (isGenerating || !modelInfo?.loaded) return null;

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      addMessage(userMessage);

      setIsGenerating(true);
      try {
        const activeProject =
          projects.find(project => project.id === activeProjectId) ?? null;
        const citations = knowledgeService.getRelevantContext(
          activeProjectId,
          text,
          knowledgeItems,
          knowledgeChunks,
          settings.retrievalTopK,
        );
        const prompt = promptService.buildPrompt(messages, text, {
          project: activeProject,
          citations,
        });
        const rawResponse = await llmService.runInference(
          prompt,
          settings.modelConfig.maxTokens,
        );

        // Post-process response (clean artifacts, trim incomplete sentences)
        const cleanedResponse = promptService.postProcessResponse(rawResponse);

        // Hallucination detection
        const contextText = citations.map(c => c.excerpt).join(' ');
        const hallCheck = promptService.detectHallucination(cleanedResponse, contextText || undefined);

        // Get current model catalog entry for hallucination risk
        const currentModelId = llmService.getCurrentModelId();
        const catalogEntry = currentModelId
          ? MODEL_CATALOG.find(m => m.id === currentModelId)
          : undefined;

        // Add warning for high-risk models or low-confidence responses
        let finalResponse = cleanedResponse;
        if (hallCheck.score < 0.5 || (catalogEntry?.hallucinationRisk === 'high' && hallCheck.flags.length > 0)) {
          finalResponse += '\n\n⚠️ *This response may contain inaccuracies. Please verify important details.*';
        }

        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: finalResponse,
          timestamp: Date.now(),
          citations,
        };
        addMessage(assistantMessage);

        return finalResponse;
      } catch (error) {
        console.error('Inference failed:', error);
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        };
        addMessage(errorMessage);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [
      messages,
      isGenerating,
      modelInfo,
      settings,
      projects,
      activeProjectId,
      knowledgeItems,
      knowledgeChunks,
      addMessage,
      setIsGenerating,
    ],
  );

  const unloadModel = useCallback(async () => {
    await llmService.unloadModel();
    setModelInfo(null);
  }, [setModelInfo]);

  const getMemoryInfo = useCallback(() => {
    return llmService.getMemoryInfo();
  }, []);

  return {
    messages,
    isGenerating,
    modelInfo,
    isModelLoading,
    loadModel,
    switchModel,
    sendMessage,
    unloadModel,
    getMemoryInfo,
  };
}
