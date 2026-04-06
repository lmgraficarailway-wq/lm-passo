@echo off
title LM Passo - Puxar Dados da Rede
cd /d "%~dp0"
echo.
echo  ==========================================
echo    LM PASSO - Puxando Dados da Rede...
echo  ==========================================
echo.
echo  Passo 1/2: Buscando dados do servidor Railway...
echo.
node scripts/pull_from_network.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERRO ao conectar na rede. Verifique sua internet
    echo  e se o servidor Railway esta online.
    echo.
    pause
    exit /b 1
)
echo.
echo  Passo 2/2: Importando dados para o banco local...
echo.
node scripts/restore_local.js
if %ERRORLEVEL% EQU 0 (
    echo.
    echo  ==========================================
    echo    DADOS SINCRONIZADOS COM SUCESSO!
    echo    Reinicie o servidor para ver as atualizacoes.
    echo  ==========================================
) else (
    echo.
    echo  ERRO ao restaurar dados. Verifique o Node.js.
)
echo.
pause
