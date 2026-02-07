@echo off
REM Start all services for Windows

setlocal enabledelayedexpansion

echo ======================================
echo Starting Soil Health Monitoring System
echo ======================================

REM Check if we're in the right directory
if not exist "backend\index.js" (
    echo Error: Please run this script from the root project directory
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if !errorlevel! neq 0 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if !errorlevel! neq 0 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

echo.
echo [1/3] Starting Node.js Backend (port 5000)...
start "Soil Health Backend" cmd /k cd backend ^&^& npm start
timeout /t 2 /nobreak

echo.
echo [2/3] Starting Python ML Service (port 5001)...
start "Soil Health ML Service" cmd /k cd backend ^&^& python ml_service.py
timeout /t 2 /nobreak

echo.
echo [3/3] Starting Frontend Dashboard (port 5173)...
start "Soil Health Dashboard" cmd /k cd dashboard ^&^& npm run dev

echo.
echo ======================================
echo All services started!
echo ======================================
echo.
echo Access the application at:
echo   Frontend:    http://localhost:5173
echo   Node.js API: http://localhost:5000
echo   ML Service:  http://localhost:5001
echo.
echo You can close these windows individually or use Ctrl+C in each to stop.
echo.
pause
