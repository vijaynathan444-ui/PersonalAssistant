#!/bin/bash
# Verify bundled GGUF model for LocalAI Assistant
# The default model (TinyLlama 1.1B Q4_K_M) is bundled with the APK.
# Additional models can be imported via the in-app file picker.

set -e

MODEL_DIR="$(dirname "$0")/../models"

echo "Checking local models directory..."

GGUF_COUNT=$(find "$MODEL_DIR" -name "*.gguf" 2>/dev/null | wc -l)

if [ "$GGUF_COUNT" -gt 0 ]; then
  echo "Found $GGUF_COUNT model(s) in $MODEL_DIR:"
  ls -lh "$MODEL_DIR"/*.gguf
  echo ""
  echo "These models will be bundled into the APK at build time."
else
  echo "No .gguf models found in $MODEL_DIR"
  echo "Place GGUF model files in $MODEL_DIR to bundle them with the APK."
fi

echo ""
echo "All models run 100% locally on-device via llama.cpp."
echo "No internet connection required."
