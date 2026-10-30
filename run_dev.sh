#!/usr/bin/env bash
# CampusOps Linux / macOS 1-Click Startup Script
set -e

echo "=========================================================="
echo "  CampusOps: Zero-Cost Intelligent Operations Platform   "
echo "=========================================================="

export PYTHONPATH="backend"

echo "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..."
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "[2/2] Starting Next.js Frontend on http://localhost:3000..."
cd frontend
npm run dev

kill $BACKEND_PID
