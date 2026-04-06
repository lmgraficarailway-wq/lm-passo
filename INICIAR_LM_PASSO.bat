@echo off
title LM Passo - Servidor
cd /d "%~dp0"

:RESTART
echo ============================================
echo       LM PASSO - Iniciando Servidor...
echo ============================================
echo.
:: Encerra qualquer instancia anterior do servidor
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
:: Abre o navegador apenas na primeira inicializacao
if "%FIRST_START%"=="" (
    set FIRST_START=1
    start "" "http://localhost:3000"
)
:: Inicia o servidor
node server.js
:: Se o servidor terminar com codigo 0 (reinicio solicitado), reiniciar automaticamente
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [REINICIANDO SERVIDOR...]
    timeout /t 1 /nobreak >nul
    goto RESTART
)
:: Qualquer outro codigo = erro ou encerramento manual
echo.
echo Servidor encerrado.
pause
