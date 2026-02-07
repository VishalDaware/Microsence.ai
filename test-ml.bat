@echo off
REM Test script for ML integration
REM Run this after starting all services to verify everything works

echo.
echo ======================================
echo ML Integration Test Suite
echo ======================================
echo.

setlocal enabledelayedexpansion

REM Color codes (Windows doesn't support ANSI by default, so using simple markers)
set "GREEN=[OK]"
set "RED=[FAIL]"

REM Function to test endpoint
:test_endpoint
set "method=%1"
set "url=%2"
set "data=%3"
set "description=%4"

echo Testing: %description%
if "%method%"=="GET" (
    curl -s "%url%" > nul
) else (
    if "%data%"=="" (
        curl -s -X %method% "%url%" > nul
    ) else (
        curl -s -X %method% "%url%" -H "Content-Type: application/json" -d "%data%" > nul
    )
)

if !errorlevel! equ 0 (
    echo %GREEN% %description%
) else (
    echo %RED% %description%
)
echo.
exit /b !errorlevel!

REM Main test sequence
echo Phase 1: Checking Service Availability
echo ======================================
echo.

REM Check if Node.js backend is running
echo Checking Node.js backend (http://localhost:5000)...
curl -s http://localhost:5000/api/health > nul
if !errorlevel! equ 0 (
    echo %GREEN% Node.js backend is running
) else (
    echo %RED% Node.js backend NOT available
    echo Please start: cd backend && npm start
    pause
    exit /b 1
)
echo.

REM Check if Python ML service is running
echo Checking Python ML service (http://localhost:5001)...
curl -s http://localhost:5001/api/ml/status > nul
if !errorlevel! equ 0 (
    echo %GREEN% Python ML service is running
) else (
    echo %RED% Python ML service NOT available
    echo Please start: cd backend && python ml_service.py
    pause
    exit /b 1
)
echo.

echo Phase 2: API Endpoint Tests
echo ======================================
echo.

REM Test health endpoint
echo Testing health endpoint...
for /f "tokens=*" %%a in ('curl -s http://localhost:5000/api/health') do set "health=%%a"
if "%health%"=="" (
    echo %RED% Health check failed
) else (
    echo %GREEN% Health check passed
    echo Response: %health%
)
echo.

REM Test ML status endpoint
echo Testing ML status endpoint...
for /f "tokens=*" %%a in ('curl -s http://localhost:5000/api/readings/ml-status') do set "ml_status=%%a"
if "%ml_status%"=="" (
    echo %RED% ML status check failed
) else (
    echo %GREEN% ML status check passed
    if "%ml_status:loaded=%"=="%ml_status%" (
        echo Warning: Models may not be loaded
    ) else (
        echo Models are loaded successfully
    )
)
echo.

REM Test generate endpoint
echo Testing generate new reading...
curl -s -X POST http://localhost:5000/api/readings/generate -H "Content-Type: application/json" -d "{}" > test_response.json
if exist test_response.json (
    echo %GREEN% Generated new reading
    for /f "tokens=*" %%a in ('findstr "success" test_response.json') do echo %%a
    del test_response.json
) else (
    echo %RED% Failed to generate reading
)
echo.

REM Test latest readings endpoint
echo Testing get latest readings...
curl -s http://localhost:5000/api/readings/latest > test_response.json
if exist test_response.json (
    echo %GREEN% Retrieved latest readings
    del test_response.json
) else (
    echo %RED% Failed to get latest readings
)
echo.

REM Test prediction endpoint
echo Testing ML predictions...
curl -s -X POST http://localhost:5000/api/readings/predict -H "Content-Type: application/json" -d "{}" > test_response.json
if exist test_response.json (
    for /f "tokens=*" %%a in ('findstr "health_score" test_response.json') do (
        echo %GREEN% ML predictions working
        echo %%a
    )
    del test_response.json
) else (
    echo %RED% Failed to get predictions
)
echo.

REM Manual prediction test
echo Testing manual prediction (sending sample data)...
curl -s -X POST http://localhost:5001/api/ml/health ^
  -H "Content-Type: application/json" ^
  -d "{\"CO2_ppm\": 700, \"Nitrate_ppm\": 15, \"pH\": 6.5, \"Temp_C\": 25, \"Moisture_pct\": 50}" > test_response.json
if exist test_response.json (
    for /f "tokens=*" %%a in ('findstr "health_score" test_response.json') do (
        echo %GREEN% Manual prediction successful
        echo %%a
    )
    for /f "tokens=*" %%a in ('findstr "health_category" test_response.json') do echo %%a
    del test_response.json
) else (
    echo %RED% Manual prediction failed
)
echo.

echo Phase 3: Frontend Access
echo ======================================
echo.
echo Open your browser to: http://localhost:5173
echo.
echo If frontend is not running:
echo   Open Terminal: cd dashboard && npm run dev
echo.

echo ======================================
echo Test Complete!
echo ======================================
echo.
echo Summary:
echo - Node.js Backend: http://localhost:5000
echo - Python ML Service: http://localhost:5001
echo - Frontend: http://localhost:5173
echo.
echo Next Steps:
echo 1. Check that all services show [OK]
echo 2. Open the dashboard in your browser
echo 3. Generate new data to see predictions
echo 4. Check the "AI Soil Health Analysis" card
echo.

pause
