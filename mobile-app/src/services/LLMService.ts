import {NativeModules, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import type {ModelInfo, ModelCatalogEntry} from '../types';

const {LLMModule} = NativeModules;

export interface LLMServiceInterface {
  loadModel(modelPath: string, contextSize: number, threads: number): Promise<ModelInfo>;
  runInference(prompt: string, maxTokens: number): Promise<string>;
  unloadModel(): Promise<boolean>;
  getModelInfo(): Promise<ModelInfo>;
  getAppModelDir(): Promise<string>;
  copyModelToAppDir(sourceUri: string, fileName: string): Promise<string>;
  extractBundledModel(assetName: string, destFileName: string): Promise<string>;
  getAvailableModels(): Promise<{id: string; path: string; sizeGB: number}[]>;
  getMemoryInfo(): MemoryInfo;
}

export interface MemoryInfo {
  estimatedUsageMB: number;
  isLowMemory: boolean;
  recommendedMaxContext: number;
  recommendedThreads: number;
}

class LLMService implements LLMServiceInterface {
  private currentModelId: string | null = null;
  private currentContextSize: number = 0;

  async loadModel(
    modelPath: string,
    contextSize: number = 4096,
    threads: number = 4,
  ): Promise<ModelInfo> {
    if (!modelPath || modelPath.trim().length === 0) {
      throw new Error('Model path is required');
    }

    // If a model is already loaded, unload it first to free memory
    try {
      const current = await this.getModelInfo();
      if (current.loaded) {
        await this.unloadModel();
      }
    } catch {
      // No model loaded, continue
    }

    const result = await LLMModule.loadModel(modelPath, contextSize, threads);
    this.currentContextSize = contextSize;
    return result;
  }

  async runInference(prompt: string, maxTokens: number = 1024): Promise<string> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    // Token budget guard: ensure prompt + maxTokens fits in context
    const estimatedPromptTokens = Math.ceil(prompt.length / 4);
    if (this.currentContextSize > 0) {
      const available = this.currentContextSize - estimatedPromptTokens;
      if (available < 32) {
        throw new Error('Prompt too long for current context window. Try a shorter message or increase context size.');
      }
      // Clamp maxTokens to available space
      maxTokens = Math.min(maxTokens, Math.max(32, available));
    }

    return await LLMModule.runInference(prompt, maxTokens);
  }

  async unloadModel(): Promise<boolean> {
    this.currentModelId = null;
    this.currentContextSize = 0;
    return await LLMModule.unloadModel();
  }

  async getModelInfo(): Promise<ModelInfo> {
    return await LLMModule.getModelInfo();
  }

  async getAppModelDir(): Promise<string> {
    if (Platform.OS === 'android') {
      return await LLMModule.getAppModelDir();
    }
    return `${RNFS.DocumentDirectoryPath}/models`;
  }

  async copyModelToAppDir(sourceUri: string, fileName: string): Promise<string> {
    const modelDir = await this.getAppModelDir();
    const destPath = `${modelDir}/${fileName}`;

    const dirExists = await RNFS.exists(modelDir);
    if (!dirExists) {
      await RNFS.mkdir(modelDir);
    }

    if (sourceUri.startsWith('content://')) {
      await RNFS.copyFile(sourceUri, destPath);
    } else {
      if (sourceUri !== destPath) {
        await RNFS.copyFile(sourceUri, destPath);
      }
    }

    return destPath;
  }

  /**
   * Extract a bundled model from Android assets to the app model directory.
   * Skips extraction if the file already exists.
   */
  async extractBundledModel(assetName: string, destFileName: string): Promise<string> {
    const modelDir = await this.getAppModelDir();
    const destPath = `${modelDir}/${destFileName}`;

    const exists = await RNFS.exists(destPath);
    if (exists) {
      return destPath;
    }

    const dirExists = await RNFS.exists(modelDir);
    if (!dirExists) {
      await RNFS.mkdir(modelDir);
    }

    if (Platform.OS === 'android') {
      await RNFS.copyFileAssets(assetName, destPath);
    }

    return destPath;
  }

  /**
   * Scan the app model directory for local .gguf files.
   * and match them to catalog entries.
   */
  async getAvailableModels(): Promise<{id: string; path: string; sizeGB: number}[]> {
    try {
      const modelDir = await this.getAppModelDir();
      const exists = await RNFS.exists(modelDir);
      if (!exists) return [];

      const files = await RNFS.readDir(modelDir);
      return files
        .filter(f => f.name.endsWith('.gguf') && !f.isDirectory())
        .map(f => ({
          id: f.name.replace('.gguf', ''),
          path: f.path,
          sizeGB: parseFloat((f.size / (1024 * 1024 * 1024)).toFixed(2)),
        }));
    } catch {
      return [];
    }
  }

  /**
   * Memory management: estimate current usage and recommend settings.
   */
  getMemoryInfo(): MemoryInfo {
    // Conservative estimates for mobile devices
    const contextMemoryMB = (this.currentContextSize / 1024) * 128; // ~128MB per 1K context
    const modelBaseMB = 200; // Base overhead
    const estimatedUsageMB = contextMemoryMB + modelBaseMB;
    const isLowMemory = estimatedUsageMB > 3000; // >3GB is risky on most phones

    // Recommend reduced settings if memory pressure is high
    let recommendedMaxContext = this.currentContextSize;
    let recommendedThreads = 4;
    if (isLowMemory) {
      recommendedMaxContext = Math.min(this.currentContextSize, 2048);
      recommendedThreads = 2;
    }

    return {
      estimatedUsageMB: Math.round(estimatedUsageMB),
      isLowMemory,
      recommendedMaxContext,
      recommendedThreads,
    };
  }

  setCurrentModelId(id: string | null): void {
    this.currentModelId = id;
  }

  getCurrentModelId(): string | null {
    return this.currentModelId;
  }
}

export const llmService = new LLMService();
export default llmService;
