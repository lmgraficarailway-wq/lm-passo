@echo off
title LM Passo - Railway para Firebase
cd /d "%~dp0"

echo.
echo  ==========================================
echo    RAILWAY ^> FIREBASE - Iniciando...
echo  ==========================================
echo.

:: Instala firebase-admin se necessario
node -e "require('firebase-admin')" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  Instalando firebase-admin... aguarde ~30s
    npm install firebase-admin --save >nul 2>&1
)

:: Para o servidor local se estiver rodando
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

:: Tenta puxar dados frescos do Railway primeiro
echo  [1/3] Tentando buscar dados atualizados do Railway...
node scripts/pull_from_network.js >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  Dados frescos do Railway obtidos!
) else (
    echo  Railway sem dados frescos, usando ultimo backup salvo.
)
echo.

:: Envia para Firebase
echo  [2/3] Enviando dados para o Firebase Firestore...
echo.
node scripts/export_to_firebase.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERRO! Verifique firebase-credentials.json
    pause
    exit /b 1
)

echo.
echo  [3/3] Iniciando servidor local...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4"') do (
    set "IP=%%a"
    goto :ip_ok
)
:ip_ok
set "IP=%IP: =%"

cls
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║    DADOS EXPORTADOS AO FIREBASE! ✓       ║
echo  ╠══════════════════════════════════════════╣
echo  ║                                          ║
echo  ║  Neste PC:   http://localhost:3000       ║
echo  ║  Na Rede:    http://%IP%:3000       ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Nao feche esta janela!
echo.

start /B cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:LOOP
node server.js
if %ERRORLEVEL% EQU 0 (
    timeout /t 1 /nobreak >nul
    goto LOOP
)
echo.
pause >nul
