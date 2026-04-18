package com.localaiassistant.llm

class LLMBridge {
    companion object {
        init {
            System.loadLibrary("localai_llm")
        }
    }

    external fun loadModel(modelPath: String, contextSize: Int, threads: Int): Boolean
    external fun runInference(prompt: String, maxTokens: Int): String
    external fun unloadModel()
    external fun isModelLoaded(): Boolean
    external fun getContextSize(): Int
}
