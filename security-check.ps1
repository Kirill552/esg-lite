# Security check script for ESG-Lite repository
# Checks for sensitive data before pushing to GitHub

Write-Host "Starting security check..." -ForegroundColor Yellow

# Check git status
$status = git status --porcelain 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git repository not found or git not installed" -ForegroundColor Red
    exit 1
}

# Check if .env file is tracked
if ($status -match "\.env$" -and $status -notmatch "\.env\.example") {
    Write-Host "WARNING: .env file is tracked and may be pushed to repository!" -ForegroundColor Red
    Write-Host "Run: git rm --cached .env" -ForegroundColor Yellow
    exit 1
}

# Check if authorized_key.json is tracked
if ($status -match "authorized_key\.json") {
    Write-Host "WARNING: authorized_key.json is tracked and may be pushed to repository!" -ForegroundColor Red
    Write-Host "Run: git rm --cached authorized_key.json" -ForegroundColor Yellow
    exit 1
}

# Check for sensitive files
$sensitiveFiles = @(
    "*.key",
    "*.pem", 
    "*secret*",
    "*password*",
    "*credential*"
)

$foundSensitive = $false
foreach ($pattern in $sensitiveFiles) {
    $files = Get-ChildItem -Path . -Recurse -File -Include $pattern -ErrorAction SilentlyContinue | 
             Where-Object { $_.Name -notmatch "\.(example|sample|md|js|ts)$" }
    
    if ($files) {
        if (-not $foundSensitive) {
            Write-Host "WARNING: Found potentially sensitive files:" -ForegroundColor Yellow
            $foundSensitive = $true
        }
        $files | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Yellow }
    }
}

# Check for large files (>10MB)
$largeFiles = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue | 
              Where-Object { $_.Length -gt 10485760 }

if ($largeFiles) {
    Write-Host "WARNING: Found large files (>10MB):" -ForegroundColor Yellow
    $largeFiles | ForEach-Object { 
        $sizeMB = [math]::Round($_.Length / 1048576, 2)
        Write-Host "  - $($_.Name) ($sizeMB MB)" -ForegroundColor Yellow
    }
    Write-Host "Consider adding to .gitignore or using Git LFS" -ForegroundColor Yellow
}

# Final check
Write-Host "" 
Write-Host "Security check completed!" -ForegroundColor Green
Write-Host "If no warnings above, repository is ready to push." -ForegroundColor Green
Write-Host ""
Write-Host "To push to new repository, run:" -ForegroundColor Cyan
Write-Host "git remote add new-origin https://github.com/Kirill552/ESG.git" -ForegroundColor White
Write-Host "git push -u new-origin main" -ForegroundColor White
