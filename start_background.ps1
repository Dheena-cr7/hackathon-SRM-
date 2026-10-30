# Start FastAPI Backend and Next.js Frontend in dedicated external console windows
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

Write-Host "Launching FastAPI Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; `$env:PYTHONPATH='.'; python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

Write-Host "Launching Next.js Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root/frontend'; npm run dev"

Write-Host "Both servers launched in independent console windows." -ForegroundColor Yellow
Write-Host "Web Application: http://localhost:3000"
Write-Host "FastAPI Docs:    http://127.0.0.1:8000/docs"

