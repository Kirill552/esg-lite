# ESG-Lite MVP - Dependencies Fix (Windows PowerShell)
# Script to fix version conflicts and install latest 2025 packages

Write-Host "ESG-Lite MVP - Dependencies Fix" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Cyan

# 1. Remove node_modules and package-lock.json
Write-Host "Cleaning old dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force
    Write-Host "node_modules removed" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force
    Write-Host "package-lock.json removed" -ForegroundColor Green
}

# 2. Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "npm cache cleared" -ForegroundColor Green

# 3. Install latest dependencies
Write-Host "Installing Next.js 15.4 + React 19..." -ForegroundColor Yellow
npm install

# 4. Security audit
Write-Host "Running security audit..." -ForegroundColor Yellow
npm audit

# 5. Auto-fix issues
Write-Host "Auto-fixing issues..." -ForegroundColor Yellow
npm audit fix

Write-Host ""
Write-Host "DONE! Dependencies updated to 2025 versions:" -ForegroundColor Green
Write-Host "  • Next.js 15.4.0 (stable 2025 version)" -ForegroundColor White
Write-Host "  • React 19.0.0 (latest version)" -ForegroundColor White
Write-Host "  • Clerk 6.31.0 (compatible with Next.js 15)" -ForegroundColor White
Write-Host "  • YooKassa-TS 0.1.14 (TypeScript package)" -ForegroundColor White
Write-Host ""
Write-Host "Now you can run: npm run dev" -ForegroundColor Cyan 