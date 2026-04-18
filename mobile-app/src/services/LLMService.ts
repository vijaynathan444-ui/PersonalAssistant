import {NativeModules} from 'react-native';
import type {ModelInfo} from '../types';

const {LLMModule} = NativeModules;

export interface LLMServiceInterface {
  loadModel(modelPath: string, contextSize: number, threads: number): Promise<ModelInfo>;
  runInference(prompt: string, maxTokens: number): Promise<string>;
  unloadModel(): Promise<boolean>;
  getModelInfo(): Promise<ModelInfo>;
}

class LLMService implements LLMServiceInterface {
  async loadModel(
    modelPath: string,
    contextSize: number = 2048,
    threads: number = 4,
  ): Promise<ModelInfo> {
    if (!modelPath || modelPath.trim().length === 0) {
      throw new Error('Model path is required');
    }
    return await LLMModule.loadModel(modelPath, contextSize, threads);
  }

  async runInference(prompt: string, maxTokens: number = 512): Promise<string> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }
    return await LLMModule.runInference(prompt, maxTokens);
  }

  async unloadModel(): Promise<boolean> {
    return await LLMModule.unloadModel();
  }

  async getModelInfo(): Promise<ModelInfo> {
    return await LLMModule.getModelInfo();
  }
}

export const llmService = new LLMService();
export default llmService;
