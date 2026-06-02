#!/bin/bash
set -e

echo ""
echo " ========================================="
echo "   FriendlyFlights"
echo " ========================================="
echo ""

# Try Docker first
if command -v docker &> /dev/null; then
  echo " [Docker found] Starting with Docker Compose..."
  docker compose up --build
  exit 0
fi

# Fall back to Node.js
if ! command -v node &> /dev/null; then
  echo " [ERROR] Neither Docker nor Node.js found."
  echo " Install Node.js from https://nodejs.org or Docker from https://docker.com"
  exit 1
fi

echo " [Node.js] Installing dependencies..."
npm install --silent

# Flight data provider: fli (free Google Flights reader, needs Python).
if command -v python3 &> /dev/null; then PY=python3; elif command -v python &> /dev/null; then PY=python; else PY=""; fi
if [ -n "$PY" ]; then
  echo " [fli] Installing Google Flights provider (pip install flights)..."
  "$PY" -m pip install --quiet --disable-pip-version-check flights \
    || echo " [fli] WARN: could not install 'flights' — using scraper fallback"
else
  echo " [fli] WARN: Python not found — using scraper fallback"
fi

echo " [Node.js] Starting server on http://localhost:3001"
echo ""
echo " Open your browser at: http://localhost:3001"
echo " Press Ctrl+C to stop."
echo ""

# Open browser (Mac / Linux)
(sleep 2 && (open http://localhost:3001 2>/dev/null || xdg-open http://localhost:3001 2>/dev/null)) &

node server.js
