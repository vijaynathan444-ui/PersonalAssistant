@echo off
REM Download the recommended GGUF model for LocalAI Assistant
REM Model: Phi-3.1-mini-4k-instruct Q4_K_M (~2.3GB)
REM License: MIT (open-source)

set MODEL_DIR=%~dp0..\models
set MODEL_FILE=%MODEL_DIR%\model.gguf
set MODEL_URL=https://huggingface.co/bartowski/Phi-3.1-mini-4k-instruct-GGUF/resolve/main/Phi-3.1-mini-4k-instruct-Q4_K_M.gguf

if not exist "%MODEL_DIR%" mkdir "%MODEL_DIR%"

if exist "%MODEL_FILE%" (
  echo Model already exists at %MODEL_FILE%
  echo Delete it first if you want to re-download.
  exit /b 0
)

echo Downloading Phi-3.1-mini-4k-instruct Q4_K_M (~2.3GB)...
echo Source: %MODEL_URL%
curl -L -o "%MODEL_FILE%" "%MODEL_URL%"

echo.
echo Download complete: %MODEL_FILE%
echo.
echo Push to device with:
echo   adb push %MODEL_FILE% /data/local/tmp/models/model.gguf
