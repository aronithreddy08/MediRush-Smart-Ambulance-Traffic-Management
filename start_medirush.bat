@echo off
title MediRush - AI Smart Ambulance Traffic Management
cd /d "%~dp0"

echo ====================================================
echo   Launching MediRush Smart Ambulance System...
echo ====================================================

if exist "dashboard\server.js" (
    cd dashboard
    where node >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        node server.js
        goto done
    )
    if exist "C:\Program Files\nodejs\node.exe" (
        "C:\Program Files\nodejs\node.exe" server.js
        goto done
    )
    cd ..
)

start http://localhost:5173

:done
pause
