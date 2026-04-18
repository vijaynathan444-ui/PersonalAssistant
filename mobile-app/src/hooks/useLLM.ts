import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useAppStore} from '../store/useAppStore';
import llmService from '../services/LLMService';
import promptService from '../services/PromptService';
import knowledgeService from '../services/KnowledgeService';
import type {ChatMessage} from '../types';

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

  const loadModel = useCallback(async (): Promise<boolean> => {
    setIsModelLoading(true);
    try {
      const {modelConfig} = settings;
      let modelPath = modelConfig.modelPath;

      // If no custom path set, try the app-scoped model directory
      if (!modelPath || modelPath === '/data/local/tmp/models/model.gguf') {
        try {
          const appModelDir = await llmService.getAppModelDir();
          const appModelPath = `${appModelDir}/model.gguf`;
          // Check if a model exists in app storage first
          const RNFS = require('react-native-fs').default;
          const exists = await RNFS.exists(appModelPath);
          if (exists) {
            modelPath = appModelPath;
          }
        } catch {
          // Fall through to try the original path
        }
      }

      const info = await llmService.loadModel(
        modelPath,
        modelConfig.contextSize,
        modelConfig.threads,
      );
      setModelInfo(info);
      promptService.setSystemPrompt(settings.systemPrompt);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load model:', message);
      setModelInfo(null);

      if (message.includes('MODEL_NOT_FOUND') || message.includes('not found')) {
        Alert.alert(
          'Model Not Found',
          'No model file found. Go to Settings and use "Pick Model File" to select a .gguf model from your device.\n\nRecommended: Phi-3.1-mini-4k-instruct Q4_K_M',
        );
      } else {
        Alert.alert('Model Load Failed', message);
      }
      return false;
    } finally {
      setIsModelLoading(false);
    }
  }, [settings, setIsModelLoading, setModelInfo]);

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
        const response = await llmService.runInference(
          prompt,
          settings.modelConfig.maxTokens,
        );

        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
          citations,
        };
        addMessage(assistantMessage);

        return response;
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

  return {
    messages,
    isGenerating,
    modelInfo,
    isModelLoading,
    loadModel,
    sendMessage,
    unloadModel,
  };
}
