# React Native ProGuard Rules

# Keep React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep our native modules
-keep class com.localaiassistant.llm.** { *; }
-keep class com.localaiassistant.voice.** { *; }
-keep class com.localaiassistant.security.** { *; }

# Keep JNI methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep TurboModules
-keep class com.facebook.react.turbomodule.** { *; }

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses

# Prevent stripping of security classes
-keep class androidx.security.crypto.** { *; }

# SQLite
-keep class org.pgsqlite.** { *; }
-keep class net.sqlcipher.** { *; }

# MMKV
-keep class com.tencent.mmkv.** { *; }

# Vosk
-keep class org.vosk.** { *; }
-keep class org.kaldi.** { *; }

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# Obfuscation settings
-repackageclasses ''
-allowaccessmodification
-overloadaggressively
