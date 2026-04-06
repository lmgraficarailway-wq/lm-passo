@echo off
title LM Passo - Restaurar Dados
cd /d "%~dp0"
echo.
echo  ==========================================
echo    RESTAURANDO DADOS DO BANCO...
echo  ==========================================
echo.
echo  Lendo scripts/db_export.json e importando
echo  para database.sqlite...
echo.
node scripts/restore_local.js
echo.
if %ERRORLEVEL% EQU 0 (
    echo  Dados restaurados! Inicie o servidor normalmente.
) else (
    echo  ERRO ao restaurar. Verifique se o Node.js esta instalado.
)
echo.
pause
