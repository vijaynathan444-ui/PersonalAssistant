# PersonalAssistant

**Fully offline AI personal assistant for Android** — powered by llama.cpp on-device inference.

- No backend, no internet dependency
- Voice + Chat interface
- Production-grade security (AES-256 encryption, root detection, ProGuard obfuscation)
- Runs GGUF quantized models directly on device

## Architecture

```
React Native (TypeScript UI)
    ↓
Kotlin Native Module (JNI Bridge)
    ↓
llama.cpp (C++ GGUF Inference)
    ↓
On-device LLM (Mistral / LLaMA / Phi / TinyLlama)
```

## Requirements

- Node.js 18+
- Android Studio with NDK 27.x
- JDK 17+
- CMake 3.22+
- ~4–8GB device RAM for model inference

## Quick Start

### 1. Setup

```bash
# Windows
scripts\setup.bat

# macOS/Linux
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

### 2. Download a GGUF Model

Choose based on your device RAM:

| Device RAM | Model | Download |
|---|---|---|
| 4GB | TinyLlama 1.1B Q4_K_M | [HuggingFace](https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF) |
| 6GB | Phi-2 Q4_K_M | [HuggingFace](https://huggingface.co/TheBloke/phi-2-GGUF) |
| 8GB+ | Mistral 7B Q4_K_M | [HuggingFace](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF) |

Place the `.gguf` file in `models/` and push to device:

```bash
adb push models/your-model.gguf /data/local/tmp/models/model.gguf
```

### 3. Run Development Build

```bash
npx react-native run-android
```

### 4. Build Production APK

```bash
# Generate signing keystore
keytool -genkey -v -keystore android/release.keystore \
  -alias localai-key -keyalg RSA -keysize 2048 -validity 10000

# Create keystore.properties from example
cp android/keystore.properties.example android/keystore.properties
# Edit android/keystore.properties with your passwords

# Build release APK
cd android && ./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
LocalAI-Assistant/
├── mobile-app/src/         # TypeScript application code
│   ├── components/         # React Native UI components
│   ├── screens/            # Chat & Settings screens
│   ├── services/           # LLM, Voice, Storage, Security services
│   ├── hooks/              # Custom React hooks (useLLM, useVoice)
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   └── __tests__/          # Test suite
├── android/                # Android native code
│   └── app/src/main/
│       ├── cpp/            # C++ JNI bridge + llama.cpp
│       ├── java/           # Kotlin native modules
│       └── res/            # Android resources
├── models/                 # GGUF model files (git-ignored)
├── voice/                  # Vosk STT model (git-ignored)
└── scripts/                # Build & setup scripts
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx jest --testPathPattern=PromptService
```

## Security Features

- **No network access**: INTERNET permission explicitly removed
- **AES-256-GCM encryption**: For sensitive local data
- **Root detection**: Warns on compromised devices
- **Anti-debugging**: Detects attached debuggers
- **ProGuard obfuscation**: Release builds are obfuscated
- **Encrypted storage**: MMKV with encryption key
- **Model protection**: Models can be encrypted on disk, decrypted in memory

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React Native (TypeScript) |
| State | Zustand |
| AI Engine | llama.cpp via JNI |
| Voice STT | Vosk (offline) |
| Voice TTS | Android TTS (offline) |
| Storage | MMKV (encrypted) + SQLite |
| Security | AES-256-GCM, root detection |
| Build | Gradle + CMake + NDK |

## License

MIT
