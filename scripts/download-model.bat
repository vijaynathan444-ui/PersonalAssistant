@echo off
REM Verify bundled GGUF model for LocalAI Assistant
REM The default model (TinyLlama 1.1B Q4_K_M) is bundled with the APK.
REM Additional models can be imported via the in-app file picker.

set MODEL_DIR=%~dp0..\models

echo Checking local models directory...

set FOUND=0
for %%f in ("%MODEL_DIR%\*.gguf") do (
  echo Found: %%~nxf (%%~zf bytes)
  set /a FOUND+=1
)

if %FOUND% GTR 0 (
  echo.
  echo %FOUND% model(s) will be bundled into the APK at build time.
) else (
  echo No .gguf models found in %MODEL_DIR%
  echo Place GGUF model files in %MODEL_DIR% to bundle them with the APK.
)

echo.
echo All models run 100%% locally on-device via llama.cpp.
echo No internet connection required.
