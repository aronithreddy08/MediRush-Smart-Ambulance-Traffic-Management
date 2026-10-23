@echo off
title MediRush - Smart Ambulance Traffic Management System
echo ========================================================
echo   Starting MediRush AI Emergency System...
echo ========================================================
echo.
echo 1. Launching Vite Dev Server...
start "" "http://localhost:5173"
call npm.cmd run dev
pause
