package com.localaiassistant.security

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import android.os.Build
import android.provider.Settings
import java.io.File
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import java.security.SecureRandom
import android.util.Base64

@ReactModule(name = SecurityModule.NAME)
class SecurityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "SecurityModule"
        private const val AES_KEY_SIZE = 256
        private const val GCM_IV_LENGTH = 12
        private const val GCM_TAG_LENGTH = 128
        private const val PBKDF2_ITERATIONS = 100000
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun isDeviceSecure(promise: Promise) {
        try {
            val result = Arguments.createMap().apply {
                putBoolean("isRooted", isRooted())
                putBoolean("isEmulator", isEmulator())
                putBoolean("isDebuggerAttached", isDebuggerAttached())
                putBoolean("secure", !isRooted() && !isEmulator() && !isDebuggerAttached())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SECURITY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun encryptData(data: String, password: String, promise: Promise) {
        try {
            val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
            val iv = ByteArray(GCM_IV_LENGTH).also { SecureRandom().nextBytes(it) }

            val keySpec = PBEKeySpec(password.toCharArray(), salt, PBKDF2_ITERATIONS, AES_KEY_SIZE)
            val keyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            val key = SecretKeySpec(keyFactory.generateSecret(keySpec).encoded, "AES")

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(GCM_TAG_LENGTH, iv))

            val encrypted = cipher.doFinal(data.toByteArray(Charsets.UTF_8))

            // Combine salt + iv + encrypted data
            val combined = salt + iv + encrypted
            val encoded = Base64.encodeToString(combined, Base64.NO_WRAP)

            promise.resolve(encoded)
        } catch (e: Exception) {
            promise.reject("ENCRYPT_ERROR", "Encryption failed: ${e.message}", e)
        }
    }

    @ReactMethod
    fun decryptData(encryptedData: String, password: String, promise: Promise) {
        try {
            val combined = Base64.decode(encryptedData, Base64.NO_WRAP)

            val salt = combined.sliceArray(0 until 16)
            val iv = combined.sliceArray(16 until 16 + GCM_IV_LENGTH)
            val encrypted = combined.sliceArray(16 + GCM_IV_LENGTH until combined.size)

            val keySpec = PBEKeySpec(password.toCharArray(), salt, PBKDF2_ITERATIONS, AES_KEY_SIZE)
            val keyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            val key = SecretKeySpec(keyFactory.generateSecret(keySpec).encoded, "AES")

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(GCM_TAG_LENGTH, iv))

            val decrypted = cipher.doFinal(encrypted)
            promise.resolve(String(decrypted, Charsets.UTF_8))
        } catch (e: Exception) {
            promise.reject("DECRYPT_ERROR", "Decryption failed: ${e.message}", e)
        }
    }

    private fun isRooted(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        )
        return paths.any { File(it).exists() }
    }

    private fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")
                || "google_sdk" == Build.PRODUCT)
    }

    private fun isDebuggerAttached(): Boolean {
        return android.os.Debug.isDebuggerConnected() || android.os.Debug.waitingForDebugger()
    }
}
