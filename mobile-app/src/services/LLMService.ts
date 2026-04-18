import {NativeModules, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import type {ModelInfo} from '../types';

const {LLMModule} = NativeModules;

export interface LLMServiceInterface {
  loadModel(modelPath: string, contextSize: number, threads: number): Promise<ModelInfo>;
  runInference(prompt: string, maxTokens: number): Promise<string>;
  unloadModel(): Promise<boolean>;
  getModelInfo(): Promise<ModelInfo>;
  getAppModelDir(): Promise<string>;
  copyModelToAppDir(sourceUri: string, fileName: string): Promise<string>;
}

class LLMService implements LLMServiceInterface {
  async loadModel(
    modelPath: string,
    contextSize: number = 4096,
    threads: number = 4,
  ): Promise<ModelInfo> {
    if (!modelPath || modelPath.trim().length === 0) {
      throw new Error('Model path is required');
    }
    return await LLMModule.loadModel(modelPath, contextSize, threads);
  }

  async runInference(prompt: string, maxTokens: number = 1024): Promise<string> {
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

  async getAppModelDir(): Promise<string> {
    if (Platform.OS === 'android') {
      return await LLMModule.getAppModelDir();
    }
    return `${RNFS.DocumentDirectoryPath}/models`;
  }

  async copyModelToAppDir(sourceUri: string, fileName: string): Promise<string> {
    const modelDir = await this.getAppModelDir();
    const destPath = `${modelDir}/${fileName}`;

    // Ensure directory exists
    const dirExists = await RNFS.exists(modelDir);
    if (!dirExists) {
      await RNFS.mkdir(modelDir);
    }

    // If source is a content:// URI, copy it
    if (sourceUri.startsWith('content://')) {
      await RNFS.copyFile(sourceUri, destPath);
    } else {
      // Regular file path
      if (sourceUri !== destPath) {
        await RNFS.copyFile(sourceUri, destPath);
      }
    }

    return destPath;
  }
}

export const llmService = new LLMService();
export default llmService;
