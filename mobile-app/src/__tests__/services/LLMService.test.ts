import llmService from '../../services/LLMService';
import {NativeModules} from 'react-native';

describe('LLMService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadModel', () => {
    it('should call native module with correct params', async () => {
      const result = await llmService.loadModel('/path/to/model.gguf', 2048, 4);
      expect(NativeModules.LLMModule.loadModel).toHaveBeenCalledWith(
        '/path/to/model.gguf',
        2048,
        4,
      );
      expect(result).toBeDefined();
    });

    it('should throw on empty model path', async () => {
      await expect(llmService.loadModel('', 2048, 4)).rejects.toThrow(
        'Model path is required',
      );
    });

    it('should throw on whitespace-only model path', async () => {
      await expect(llmService.loadModel('   ', 2048, 4)).rejects.toThrow(
        'Model path is required',
      );
    });

    it('should use default values for optional params', async () => {
      await llmService.loadModel('/model.gguf');
      expect(NativeModules.LLMModule.loadModel).toHaveBeenCalledWith(
        '/model.gguf',
        2048,
        4,
      );
    });
  });

  describe('runInference', () => {
    it('should call native module with prompt', async () => {
      const result = await llmService.runInference('Hello', 512);
      expect(NativeModules.LLMModule.runInference).toHaveBeenCalledWith('Hello', 512);
      expect(result).toBe('Test response');
    });

    it('should throw on empty prompt', async () => {
      await expect(llmService.runInference('', 512)).rejects.toThrow(
        'Prompt is required',
      );
    });

    it('should use default maxTokens', async () => {
      await llmService.runInference('Hello');
      expect(NativeModules.LLMModule.runInference).toHaveBeenCalledWith('Hello', 512);
    });
  });

  describe('unloadModel', () => {
    it('should call native unload', async () => {
      await llmService.unloadModel();
      expect(NativeModules.LLMModule.unloadModel).toHaveBeenCalled();
    });
  });

  describe('getModelInfo', () => {
    it('should return model info', async () => {
      const info = await llmService.getModelInfo();
      expect(info).toEqual({loaded: true, contextSize: 2048});
    });
  });
});
