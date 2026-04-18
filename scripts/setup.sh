#!/bin/bash
# Setup script for LocalAI Assistant
# Run this ONCE after cloning the repo

set -e

echo "=== LocalAI Assistant Setup ==="

# 1. Install npm dependencies
echo "[1/5] Installing Node.js dependencies..."
npm install

# 2. Clone llama.cpp into the cpp directory
LLAMA_DIR="android/app/src/main/cpp/llama.cpp"
if [ ! -d "$LLAMA_DIR" ]; then
    echo "[2/5] Cloning llama.cpp..."
    git clone https://github.com/ggerganov/llama.cpp "$LLAMA_DIR"
else
    echo "[2/5] llama.cpp already exists, pulling latest..."
    cd "$LLAMA_DIR" && git pull && cd -
fi

# 3. Create models directory
echo "[3/5] Creating models directory..."
mkdir -p models

# 4. Create voice model directory
echo "[4/5] Creating voice model directory..."
mkdir -p voice/vosk-model-small-en

# 5. Display next steps
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Download a GGUF model (e.g., TinyLlama Q4_K_M) and place it in models/"
echo "  2. Download Vosk model (vosk-model-small-en-us-0.15) and extract to voice/"
echo "  3. Copy the keystore.properties.example to keystore.properties and fill in values"
echo "  4. Run: npx react-native run-android"
echo ""
echo "For production APK:"
echo "  1. Generate keystore: keytool -genkey -v -keystore android/release.keystore -alias localai-key -keyalg RSA -keysize 2048 -validity 10000"
echo "  2. Fill in android/keystore.properties"
echo "  3. Run: cd android && ./gradlew assembleRelease"
echo "  4. APK: android/app/build/outputs/apk/release/app-release.apk"
