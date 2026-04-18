package com.localaiassistant.voice

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.io.File
import java.util.Locale

@ReactModule(name = VoskModule.NAME)
class VoskModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener {

    companion object {
        const val NAME = "VoskModule"
    }

    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var listenerCount = 0

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        tts = TextToSpeech(reactContext, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.US
            tts?.setSpeechRate(1.0f)
            ttsReady = true

            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    sendEvent("ttsStart", Arguments.createMap().apply {
                        putString("utteranceId", utteranceId)
                    })
                }

                override fun onDone(utteranceId: String?) {
                    sendEvent("ttsDone", Arguments.createMap().apply {
                        putString("utteranceId", utteranceId)
                    })
                }

                @Deprecated("Deprecated")
                override fun onError(utteranceId: String?) {
                    sendEvent("ttsError", Arguments.createMap().apply {
                        putString("utteranceId", utteranceId)
                    })
                }
            })
        }
    }

    @ReactMethod
    fun speak(text: String, promise: Promise) {
        if (!ttsReady || tts == null) {
            promise.reject("TTS_NOT_READY", "Text-to-speech not initialized")
            return
        }

        // Sanitize: limit text length to prevent abuse
        val safeText = if (text.length > 5000) text.take(5000) else text
        val utteranceId = "tts_${System.currentTimeMillis()}"

        val result = tts?.speak(safeText, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
        if (result == TextToSpeech.SUCCESS) {
            promise.resolve(utteranceId)
        } else {
            promise.reject("TTS_ERROR", "Failed to start speech")
        }
    }

    @ReactMethod
    fun stopSpeaking(promise: Promise) {
        tts?.stop()
        promise.resolve(true)
    }

    @ReactMethod
    fun isTTSReady(promise: Promise) {
        promise.resolve(ttsReady)
    }

    @ReactMethod
    fun initializeVosk(modelPath: String, promise: Promise) {
        try {
            val modelDir = File(modelPath)
            if (!modelDir.exists() || !modelDir.isDirectory) {
                promise.reject("VOSK_MODEL_NOT_FOUND", "Vosk model directory not found: $modelPath")
                return
            }
            // Vosk initialization will be loaded through react-native-vosk package
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("VOSK_INIT_ERROR", "Failed to initialize Vosk: ${e.message}", e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount++
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount -= count
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        if (listenerCount > 0) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    override fun invalidate() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        super.invalidate()
    }
}
