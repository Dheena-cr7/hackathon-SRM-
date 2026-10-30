# CampusOps Windows 1-Click Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CampusOps: Zero-Cost Intelligent Operations Platform   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$env:PYTHONPATH = "backend"
$backendProcess = Start-Process python -ArgumentList "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

# 2. Start Next.js Frontend
Write-Host "[2/2] Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
Set-Location frontend
npm run dev

# Cleanup when user stops frontend
Stop-Process -Id $backendProcess.Id

