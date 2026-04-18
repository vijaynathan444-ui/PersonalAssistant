package com.localaiassistant.llm

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.*
import java.io.File

@ReactModule(name = LLMModule.NAME)
class LLMModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "LLMModule"
    }

    private val bridge = LLMBridge()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName(): String = NAME

    @ReactMethod
    fun getAppModelDir(promise: Promise) {
        try {
            val dir = reactApplicationContext.getExternalFilesDir(null)
            val modelDir = File(dir, "models")
            if (!modelDir.exists()) {
                modelDir.mkdirs()
            }
            promise.resolve(modelDir.absolutePath)
        } catch (e: Exception) {
            promise.reject("DIR_ERROR", "Failed to get model directory: ${e.message}", e)
        }
    }

    @ReactMethod
    fun loadModel(modelPath: String, contextSize: Int, threads: Int, promise: Promise) {
        scope.launch {
            try {
                // Validate model file exists
                val file = File(modelPath)
                if (!file.exists()) {
                    promise.reject("MODEL_NOT_FOUND", "Model file not found: $modelPath")
                    return@launch
                }

                // Validate file size (basic check)
                if (file.length() < 1024) {
                    promise.reject("INVALID_MODEL", "Model file appears to be invalid (too small)")
                    return@launch
                }

                val result = bridge.loadModel(modelPath, contextSize, threads)
                if (result) {
                    val info = Arguments.createMap().apply {
                        putBoolean("loaded", true)
                        putInt("contextSize", bridge.getContextSize())
                    }
                    promise.resolve(info)
                } else {
                    promise.reject("LOAD_FAILED", "Failed to load model")
                }
            } catch (e: Exception) {
                promise.reject("LOAD_ERROR", "Error loading model: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun runInference(prompt: String, maxTokens: Int, promise: Promise) {
        scope.launch {
            try {
                if (!bridge.isModelLoaded()) {
                    promise.reject("MODEL_NOT_LOADED", "Model is not loaded")
                    return@launch
                }

                // Sanitize input - prevent excessively long prompts
                val sanitizedPrompt = if (prompt.length > 10000) {
                    prompt.take(10000)
                } else {
                    prompt
                }

                val response = bridge.runInference(sanitizedPrompt, maxTokens)
                promise.resolve(response)
            } catch (e: Exception) {
                promise.reject("INFERENCE_ERROR", "Inference failed: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun unloadModel(promise: Promise) {
        scope.launch {
            try {
                bridge.unloadModel()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("UNLOAD_ERROR", "Error unloading model: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun getModelInfo(promise: Promise) {
        try {
            val info = Arguments.createMap().apply {
                putBoolean("loaded", bridge.isModelLoaded())
                putInt("contextSize", bridge.getContextSize())
            }
            promise.resolve(info)
        } catch (e: Exception) {
            promise.reject("INFO_ERROR", "Error getting model info: ${e.message}", e)
        }
    }

    override fun invalidate() {
        scope.cancel()
        bridge.unloadModel()
        super.invalidate()
    }
}
