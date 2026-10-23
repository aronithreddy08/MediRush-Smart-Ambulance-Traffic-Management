@echo off
title MediRush - Smart Ambulance Traffic Management System
cd /d "%~dp0"

echo ===================================================================
echo     MediRush - Smart Ambulance Traffic Management System
echo ===================================================================
echo.
echo   [1] Start Frontend Dashboard Only (Recommended - Fast)
echo   [2] Start Full Stack (FastAPI Backend + Frontend Dashboard)
echo   [3] Start Frontend Development Server (Vite)
echo   [4] Start Backend API Only (FastAPI on Port 8000)
echo.
set /p choice="Enter choice [1-4] (Default is 1): "
if "%choice%"=="" set choice=1

if "%choice%"=="1" goto start_dashboard
if "%choice%"=="2" goto start_fullstack
if "%choice%"=="3" goto start_vite
if "%choice%"=="4" goto start_backend

:start_dashboard
echo.
echo Starting MediRush Dashboard on http://localhost:5173 ...
cd dashboard
node server.js
goto end

:start_fullstack
echo.
echo Starting FastAPI Backend on http://localhost:8000 ...
start "MediRush Backend (FastAPI)" cmd /c "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8000"
timeout /t 2 >nul
echo Starting MediRush Dashboard on http://localhost:5173 ...
cd dashboard
node server.js
goto end

:start_vite
echo.
echo Starting Vite Development Server on http://localhost:5173 ...
cd dashboard
npm run dev
goto end

:start_backend
echo.
echo Starting FastAPI Backend on http://localhost:8000 ...
cd backend
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)
python -m uvicorn main:app --reload --port 8000
goto end

:end
pause
