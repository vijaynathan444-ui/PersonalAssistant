@echo off
REM Setup script for LocalAI Assistant (Windows)
REM Run this ONCE after cloning the repo

echo === LocalAI Assistant Setup ===

REM 1. Install npm dependencies
echo [1/5] Installing Node.js dependencies...
call npm install

REM 2. Clone llama.cpp
set LLAMA_DIR=android\app\src\main\cpp\llama.cpp
if not exist "%LLAMA_DIR%" (
    echo [2/5] Cloning llama.cpp...
    git clone https://github.com/ggerganov/llama.cpp "%LLAMA_DIR%"
) else (
    echo [2/5] llama.cpp already exists, pulling latest...
    cd "%LLAMA_DIR%" && git pull && cd /d "%~dp0\.."
)

REM 3. Create directories
echo [3/5] Creating models directory...
if not exist "models" mkdir models

echo [4/5] Creating voice model directory...
if not exist "voice\vosk-model-small-en" mkdir "voice\vosk-model-small-en"

echo.
echo === Setup Complete ===
echo.
echo Next steps:
echo   1. Download a GGUF model and place it in models\
echo   2. Download Vosk model and extract to voice\
echo   3. Copy keystore.properties.example to keystore.properties
echo   4. Run: npx react-native run-android
echo.
echo For production APK:
echo   1. Generate keystore: keytool -genkey -v -keystore android\release.keystore -alias localai-key -keyalg RSA -keysize 2048 -validity 10000
echo   2. Fill in android\keystore.properties
echo   3. Run: cd android ^&^& gradlew assembleRelease
echo   4. APK: android\app\build\outputs\apk\release\app-release.apk
pause
