# Selective ESG-Lite Project Cleanup
# Removes only unnecessary test scripts and development files
# Keeps all important production files

Write-Host "Cleaning ESG-Lite project selectively..." -ForegroundColor Green

$deletedCount = 0

# Function to safely remove file
function Remove-SafelyIfExists {
    param($path)
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "Deleted: $path" -ForegroundColor Yellow
        $script:deletedCount++
        return $true
    }
    return $false
}

Write-Host "Removing unnecessary test scripts..." -ForegroundColor Cyan

# Remove test scripts (keep production scripts!)
$testScriptsToRemove = @(
    "scripts/test-basic-logging.js",
    "scripts/test-credits-page.js",
    "scripts/test-credits-performance.js",
    "scripts/test-document-queue-fields.js",
    "scripts/test-health-api.js",
    "scripts/test-health-monitor.js",
    "scripts/test-metrics-api-simple.js",
    "scripts/test-metrics-api.js",
    "scripts/test-metrics-system.js",
    "scripts/test-monetization-integration.js",
    "scripts/test-monetization-stubs.js",
    "scripts/test-ocr-api-queued.js",
    "scripts/test-ocr-get-status.js",
    "scripts/test-ocr-status-real.js",
    "scripts/test-ocr-worker-progress.js",
    "scripts/test-ocr-worker.js",
    "scripts/test-payment-api-structure.js",
    "scripts/test-payment-service-structure.js",
    "scripts/test-payment-service.js",
    "scripts/test-pricing-notifications.js",
    "scripts/test-queue-basic.js",
    "scripts/test-queue-cleanup.js",
    "scripts/test-queue-management.js",
    "scripts/test-queue-manager.js",
    "scripts/test-queue-tables.js",
    "scripts/test-rate-limiter.js",
    "scripts/test-real-database-performance.js",
    "scripts/test-security.js",
    "scripts/test-structured-logging.js",
    "scripts/test-subscription-page.js",
    "scripts/test-yandex-monitoring.js",
    "scripts/test-yandex-monitoring.ts",
    "scripts/test-yookassa-config.js",
    "scripts/test-yookassa-integration.js",
    "scripts/test-yookassa-typescript.ts",
    "scripts/test-metrics-curl.sh"
)

foreach ($script in $testScriptsToRemove) {
    Remove-SafelyIfExists $script
}

Write-Host "Removing completion reports..." -ForegroundColor Cyan

# Remove task completion reports
$reportsToRemove = @(
    "docs/TASK-11.1-COMPLETION-REPORT.md",
    "docs/TASK-14.1-COMPLETION-REPORT.md",
    "docs/TASK-14.2-COMPLETION-REPORT.md", 
    "docs/TASK-15.1-COMPLETION-REPORT.md",
    "docs/TASK-15.2-COMPLETION-REPORT.md",
    "docs/TASK_5_COMPLETION_REPORT.md",
    "docs/TASK_5.2_COMPLETION_REPORT.md",
    "docs/TASK_5.3_COMPLETION_REPORT.md",
    "docs/SCRIPTS-CLEANUP-REPORT.md",
    "docs/MIGRATION_SUCCESS_REPORT.md"
)

foreach ($report in $reportsToRemove) {
    Remove-SafelyIfExists $report
}

Write-Host "Removing development documents..." -ForegroundColor Cyan

# Remove development docs
$devDocsToRemove = @(
    "REPORT-GENERATION-FIX.md",
    "PROJECT-CLEANUP-REPORT.md",
    "design-system.md", 
    "esg_lite_strategy_tasks.md",
    "esg_lite_rdp_2025.md",
    "CHECKO_INTEGRATION.md",
    "SECURITY-VULNERABILITIES-RESOLVED.md",
    "docs/MONETIZATION_STUBS.md",
    "docs/RATE_LIMITING_FIXES.md",
    "docs/DOCKER_SECURITY_UPDATE.md"
)

foreach ($doc in $devDocsToRemove) {
    Remove-SafelyIfExists $doc
}

Write-Host "Removing monetization examples folder..." -ForegroundColor Cyan

# Remove monetization examples folder (already integrated)
if (Test-Path "monetization-credits-system") {
    Remove-Item "monetization-credits-system" -Recurse -Force
    Write-Host "Deleted folder: monetization-credits-system/" -ForegroundColor Yellow
    $deletedCount++
}

Write-Host "" 
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "Files deleted: $deletedCount" -ForegroundColor White
Write-Host ""
Write-Host "PRESERVED IMPORTANT FILES:" -ForegroundColor Green
Write-Host "- scripts/deploy.sh (production deployment)" -ForegroundColor Gray
Write-Host "- scripts/start-ocr-worker.js (OCR worker)" -ForegroundColor Gray
Write-Host "- scripts/run-migration.js (database migrations)" -ForegroundColor Gray
Write-Host "- scripts/validate-queue-config.js (validation)" -ForegroundColor Gray
Write-Host "- scripts/metrics-exporter.js (monitoring)" -ForegroundColor Gray
Write-Host "- README.md and all important documentation" -ForegroundColor Gray
Write-Host "- docs/API_ENDPOINTS.md" -ForegroundColor Gray
Write-Host "- docs/TROUBLESHOOTING.md" -ForegroundColor Gray
Write-Host "- yookassa-docs.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Ready to commit changes!" -ForegroundColor Magenta
