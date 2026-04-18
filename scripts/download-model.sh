#!/bin/bash
# Download the recommended GGUF model for LocalAI Assistant
# Model: Phi-3.1-mini-4k-instruct Q4_K_M (~2.3GB)
# License: MIT (open-source)

set -e

MODEL_DIR="$(dirname "$0")/../models"
MODEL_FILE="$MODEL_DIR/model.gguf"
MODEL_URL="https://huggingface.co/bartowski/Phi-3.1-mini-4k-instruct-GGUF/resolve/main/Phi-3.1-mini-4k-instruct-Q4_K_M.gguf"

mkdir -p "$MODEL_DIR"

if [ -f "$MODEL_FILE" ]; then
  echo "Model already exists at $MODEL_FILE"
  echo "Delete it first if you want to re-download."
  exit 0
fi

echo "Downloading Phi-3.1-mini-4k-instruct Q4_K_M (~2.3GB)..."
echo "Source: $MODEL_URL"
curl -L -o "$MODEL_FILE" "$MODEL_URL"

echo ""
echo "Download complete: $MODEL_FILE"
echo ""
echo "Push to device with:"
echo "  adb push $MODEL_FILE /data/local/tmp/models/model.gguf"
