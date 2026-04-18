###############################################################################
# LocalAI Assistant - Full Build Verification Script (PowerShell 5.1)
# Run from: d:\projects\PersonalAssistant\LocalAI-Assistant
# Usage:    .\scripts\verify-build.ps1
###############################################################################
Set-StrictMode -Version 1

$Project = "d:\projects\PersonalAssistant\LocalAI-Assistant"
$fails   = @()

function Pass([string]$msg, [string]$detail) {
    Write-Host "[PASS]  $msg" -ForegroundColor Green
    if ($detail) { Write-Host "        $detail" -ForegroundColor DarkGray }
}
function Fail([string]$msg, [string]$fix) {
    Write-Host "[FAIL]  $msg" -ForegroundColor Red
    if ($fix) { Write-Host "        FIX: $fix" -ForegroundColor Yellow }
    $script:fails += $msg
}
function Warn([string]$msg, [string]$detail) {
    Write-Host "[WARN]  $msg" -ForegroundColor Yellow
    if ($detail) { Write-Host "        $detail" -ForegroundColor DarkGray }
}
function Section([string]$title) {
    Write-Host ""
    Write-Host "------------------------------------------------" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "------------------------------------------------" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "  LocalAI Assistant - Build Verifier" -ForegroundColor White
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray

#──────────────────────────────────────────────────────────────────────────────
Section "STEP 0: Prerequisites"
#──────────────────────────────────────────────────────────────────────────────

# Node.js
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeVer = (node --version 2>&1).ToString()
    Pass "Node.js installed" $nodeVer
} else {
    Fail "Node.js NOT found" "winget install OpenJS.NodeJS.LTS --accept-package-agreements"
}

# npm
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($npmCmd) {
    Pass "npm installed" (npm --version 2>&1).ToString()
} else {
    Fail "npm NOT found" "Reinstall Node.js LTS (npm ships with it)"
}

# Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if ($javaCmd) {
    $jv = (java --version 2>&1)[0].ToString()
    Pass "Java JDK installed" $jv
} else {
    Fail "Java JDK NOT found" "winget install Microsoft.OpenJDK.17 --accept-package-agreements"
}

# Git
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) {
    Pass "Git installed" (git --version 2>&1).ToString()
} else {
    Fail "Git NOT found" "winget install Git.Git --accept-package-agreements"
}

# Android SDK
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) { $androidHome = $env:ANDROID_SDK_ROOT }
if (-not $androidHome) {
    $candidate = Join-Path $env:LOCALAPPDATA "Android\Sdk"
    if (Test-Path $candidate) { $androidHome = $candidate }
}

$adbExe = $null
if ($androidHome -and (Test-Path (Join-Path $androidHome "platform-tools\adb.exe"))) {
    Pass "Android SDK found" $androidHome
    $adbExe = Join-Path $androidHome "platform-tools\adb.exe"
} else {
    $hint = "Install Android Studio from https://developer.android.com/studio"
    Fail "Android SDK NOT found (ANDROID_HOME not set)" $hint
    $androidHome = $null
}

# Android NDK
if ($androidHome) {
    $ndkBase = Join-Path $androidHome "ndk"
    if (Test-Path $ndkBase) {
        $ndkDir = Get-ChildItem $ndkBase | Sort-Object Name -Descending | Select-Object -First 1
        if ($ndkDir) {
            Pass "Android NDK installed" $ndkDir.FullName
        } else {
            Fail "Android NDK NOT found" "SDK Manager > NDK (Side by side) 27.x"
        }
    } else {
        Fail "Android NDK NOT found" "SDK Manager > NDK (Side by side) 27.x"
    }
} else {
    Fail "Android NDK check skipped" "Install Android SDK first"
}

# CMake
$cmakeCmd = Get-Command cmake -ErrorAction SilentlyContinue
if ($cmakeCmd) {
    Pass "CMake installed (system)" (cmake --version 2>&1 | Select-Object -First 1).ToString()
} elseif ($androidHome) {
    $cmakePath = Join-Path $androidHome "cmake"
    $cmakeExe = Get-ChildItem $cmakePath -Recurse -Filter "cmake.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmakeExe) {
        Pass "CMake found in Android SDK" $cmakeExe.DirectoryName
    } else {
        Fail "CMake NOT found" "SDK Manager > SDK Tools > CMake 3.22+"
    }
} else {
    Fail "CMake NOT found" "SDK Manager > SDK Tools > CMake 3.22+"
}

# adb
if ($adbExe) {
    $adbVer = (& $adbExe version 2>&1 | Select-Object -First 1).ToString()
    Pass "adb found" $adbVer
} else {
    Fail "adb NOT found" "Part of Android SDK platform-tools"
}

#──────────────────────────────────────────────────────────────────────────────
Section "STEP 1: scripts\setup.bat (npm install + llama.cpp clone)"
#──────────────────────────────────────────────────────────────────────────────

if (Test-Path "$Project\package.json") {
    Pass "package.json exists" ""
} else {
    Fail "package.json missing" "Project source files are incomplete"
}

if (Test-Path "$Project\node_modules") {
    $modCount = (Get-ChildItem "$Project\node_modules" -Directory | Measure-Object).Count
    Pass "node_modules installed" "$modCount packages"
} else {
    Fail "node_modules NOT installed" "Run: cd `"$Project`" ; npm install"
}

$llamaMarker = "$Project\android\app\src\main\cpp\llama.cpp\CMakeLists.txt"
if (Test-Path $llamaMarker) {
    Pass "llama.cpp cloned into cpp/" ""
} else {
    $cloneTarget = "$Project\android\app\src\main\cpp\llama.cpp"
    Fail "llama.cpp NOT cloned" "git clone https://github.com/ggerganov/llama.cpp `"$cloneTarget`""
}

if (-not (Test-Path "$Project\models")) {
    New-Item -ItemType Directory -Path "$Project\models" | Out-Null
}
Pass "models/ directory" "$Project\models"

if (-not (Test-Path "$Project\voice")) {
    New-Item -ItemType Directory -Path "$Project\voice" | Out-Null
}
Pass "voice/ directory" "$Project\voice"

#──────────────────────────────────────────────────────────────────────────────
Section "STEP 2: adb push (GGUF model to device)"
#──────────────────────────────────────────────────────────────────────────────

$ggufFiles = @(Get-ChildItem "$Project\models" -Filter "*.gguf" -ErrorAction SilentlyContinue)
$ggufPath  = $null
if ($ggufFiles.Count -gt 0) {
    $names = ($ggufFiles | Select-Object -ExpandProperty Name) -join ", "
    Pass "GGUF model in models/" $names
    $ggufPath = $ggufFiles[0].FullName
} else {
    Fail "No GGUF model in models/" "Place a .gguf model file in $Project\models\ to bundle it with the APK"
}

if ($adbExe) {
    $deviceOut = & $adbExe devices 2>&1
    $connected = $deviceOut | Where-Object { $_ -match "`tdevice$" } | Select-Object -First 1
    if ($connected) {
        $serial = ($connected -split "`t")[0]
        Pass "Android device connected" "Serial: $serial"

        $mkResult = & $adbExe shell "mkdir -p /data/local/tmp/models; echo DIR_OK" 2>&1
        if ($mkResult -match "DIR_OK") {
            Pass "Device path /data/local/tmp/models/ ready" ""
        } else {
            Warn "Could not verify device path" ($mkResult -join " ")
        }

        if ($ggufPath) {
            Write-Host ""
            Write-Host "  PUSH COMMAND (run this):" -ForegroundColor Cyan
            Write-Host "  adb push `"$ggufPath`" /data/local/tmp/models/model.gguf" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Fail "No Android device connected" "Enable USB Debugging on device (Settings > Developer Options) and connect via USB"
    }
} else {
    Fail "adb not available" "Install Android SDK"
}

#──────────────────────────────────────────────────────────────────────────────
Section "STEP 3: npx react-native run-android"
#──────────────────────────────────────────────────────────────────────────────

if (Test-Path "$Project\android\app\build.gradle") {
    Pass "android/app/build.gradle present" ""
} else {
    Fail "android/app/build.gradle missing" ""
}

$localPropsPath = "$Project\android\local.properties"
if (Test-Path $localPropsPath) {
    $lpContent = (Get-Content $localPropsPath -Raw).Trim()
    Pass "android/local.properties exists" $lpContent
} elseif ($androidHome) {
    $sdkFwd = $androidHome -replace "\\", "/"
    Set-Content $localPropsPath "sdk.dir=$sdkFwd"
    Pass "android/local.properties CREATED" "sdk.dir=$sdkFwd"
} else {
    Fail "android/local.properties missing" "Create the file with: sdk.dir=C:/Users/yourname/AppData/Local/Android/Sdk"
}

if (Test-Path "$Project\android\gradlew.bat") {
    Pass "android/gradlew.bat present" ""
} else {
    Fail "android/gradlew.bat missing" "Run inside android/: gradle wrapper --gradle-version 8.10.2"
}

if ($nodeCmd -and (Test-Path "$Project\node_modules")) {
    Pass "npx react-native run-android is READY" "run from $Project"
} else {
    Fail "npx react-native run-android NOT ready" "Node.js and npm install required first"
}

#──────────────────────────────────────────────────────────────────────────────
Section "STEP 4: gradlew assembleRelease (Production APK)"
#──────────────────────────────────────────────────────────────────────────────

$kpFile = "$Project\android\keystore.properties"
if (Test-Path $kpFile) {
    Pass "android/keystore.properties exists" ""
    $kpLines = Get-Content $kpFile | Where-Object { $_ -notmatch "^#" -and $_ -match "=" }
    $sfLine = $kpLines | Where-Object { $_ -match "^STORE_FILE" }
    if ($sfLine) {
        $sfName = ($sfLine -split "=", 2)[1].Trim()
        $sfFull = "$Project\android\$sfName"
        if (Test-Path $sfFull) {
            $sfSize = [math]::Round((Get-Item $sfFull).Length / 1KB, 1)
            Pass "Keystore file ($sfName) exists" "${sfSize}KB"
        } else {
            Fail "Keystore file ($sfName) NOT found" "keytool -genkey -v -keystore `"$sfFull`" -alias localai-key -keyalg RSA -keysize 2048 -validity 10000"
        }
    }
} else {
    $example = "$Project\android\keystore.properties.example"
    Fail "android/keystore.properties missing" "copy `"$example`" `"$kpFile`"  then fill passwords and run keytool"
}

if (Test-Path "$Project\android\app\proguard-rules.pro") {
    Pass "proguard-rules.pro present" ""
} else {
    Fail "proguard-rules.pro missing" ""
}

$appGradle = Get-Content "$Project\android\app\build.gradle" -Raw -ErrorAction SilentlyContinue
if ($appGradle -and ($appGradle -match "minifyEnabled\s+true")) {
    Pass "minifyEnabled=true configured for release" ""
} else {
    Fail "minifyEnabled not found in release config" "Check buildTypes.release in android/app/build.gradle"
}

if ((Test-Path "$Project\android\gradlew.bat") -and $javaCmd) {
    Write-Host "  Checking Gradle..." -ForegroundColor DarkGray
    Push-Location "$Project\android"
    $gv = (.\gradlew.bat --version 2>&1) -join "`n"
    Pop-Location
    $gvLine = ($gv -split "`n" | Where-Object { $_ -match "^Gradle " }) -join ""
    if ($gvLine) {
        Pass "Gradle wrapper executes" $gvLine.Trim()
    } else {
        Fail "Gradle wrapper failed to run" "Check JAVA_HOME or re-run: winget install Microsoft.OpenJDK.17"
    }
} else {
    Warn "Gradle check skipped" "Java or gradlew.bat not available"
}

$apkOut = "$Project\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkOut) {
    $apkMB = [math]::Round((Get-Item $apkOut).Length / 1MB, 1)
    Pass "Release APK already built" "${apkMB} MB at $apkOut"
} else {
    Warn "APK not yet built (expected until you run assembleRelease)" "cd `"$Project\android`" ; .\gradlew.bat assembleRelease"
}

#──────────────────────────────────────────────────────────────────────────────
Section "SUMMARY"
#──────────────────────────────────────────────────────────────────────────────

if ($fails.Count -eq 0) {
    Write-Host "  ALL CHECKS PASSED - environment is ready to build!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Run in order:" -ForegroundColor Cyan
    Write-Host "  1.  cd `"$Project`" ; npm install" -ForegroundColor White
    Write-Host "  2.  adb push models\model.gguf /data/local/tmp/models/model.gguf" -ForegroundColor White
    Write-Host "  3.  npx react-native run-android" -ForegroundColor White
    Write-Host "  4.  cd `"$Project\android`" ; .\gradlew.bat assembleRelease" -ForegroundColor White
} else {
    Write-Host "  $($fails.Count) FAILED check(s):" -ForegroundColor Red
    foreach ($f in $fails) { Write-Host "    - $f" -ForegroundColor Red }
    Write-Host ""
    Write-Host "  Install all missing tools (run PowerShell as Administrator):" -ForegroundColor Yellow
    Write-Host "  winget install OpenJS.NodeJS.LTS Microsoft.OpenJDK.17 Git.Git --accept-package-agreements" -ForegroundColor White
    Write-Host "  Then: https://developer.android.com/studio (SDK + NDK 27.x + CMake 3.22+)" -ForegroundColor White
}
Write-Host ""
