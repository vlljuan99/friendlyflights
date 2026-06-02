@echo off
title FriendlyFlights

echo.
echo  =========================================
echo    FriendlyFlights
echo  =========================================
echo.

:: Check for Docker first
docker --version >nul 2>&1
if %errorlevel% == 0 (
  echo  [Docker found] Starting with Docker Compose...
  docker compose up --build
  goto end
)

:: Fall back to Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Neither Docker nor Node.js found.
  echo  Install Node.js from https://nodejs.org or Docker from https://docker.com
  pause
  goto end
)

echo  [Node.js] Installing dependencies...
call npm install --silent

:: Flight data provider: fli (free Google Flights reader, needs Python).
python --version >nul 2>&1
if %errorlevel% == 0 (
  echo  [fli] Installing Google Flights provider ^(pip install flights^)...
  python -m pip install --quiet --disable-pip-version-check flights || echo  [fli] WARN: could not install 'flights' - using scraper fallback
) else (
  echo  [fli] WARN: Python not found - using scraper fallback
)

echo  [Node.js] Starting server on http://localhost:3001
echo.
echo  Open your browser at: http://localhost:3001
echo  Press Ctrl+C to stop.
echo.

:: Open browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3001"

node server.js

:end
