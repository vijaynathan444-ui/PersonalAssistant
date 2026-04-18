import {useCallback} from 'react';
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

  const loadModel = useCallback(async () => {
    setIsModelLoading(true);
    try {
      const {modelConfig} = settings;
      const info = await llmService.loadModel(
        modelConfig.modelPath,
        modelConfig.contextSize,
        modelConfig.threads,
      );
      setModelInfo(info);
      promptService.setSystemPrompt(settings.systemPrompt);
      return true;
    } catch (error) {
      console.error('Failed to load model:', error);
      setModelInfo(null);
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
