@echo off
title Stop MediRush Services
echo ===================================================================
echo   Stopping any running MediRush processes (Node, Vite, Uvicorn)...
echo ===================================================================
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    echo Stopping process on port 5173 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo Stopping process on port 8000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All MediRush background services stopped successfully.
pause
