# Скрипт для подготовки репозитория к публикации
# Проверяет, что секретные данные не будут отправлены в репозиторий

# Проверка, что файл .env не будет добавлен в коммит
$status = git status --porcelain

if ($status -match "\.env$" -and $status -notmatch "\.env\.example") {
    Write-Host "WARNING: Файл .env находится в отслеживаемых файлах и может быть отправлен в репозиторий!" -ForegroundColor Red
    Write-Host "Убедитесь, что файл .env добавлен в .gitignore и удален из индекса git." -ForegroundColor Yellow
    Write-Host "Выполните: git rm --cached .env" -ForegroundColor Yellow
    exit 1
}

# Проверка, что authorized_key.json не будет добавлен в коммит
if ($status -match "authorized_key\.json") {
    Write-Host "WARNING: Файл authorized_key.json находится в отслеживаемых файлах и может быть отправлен в репозиторий!" -ForegroundColor Red
    Write-Host "Выполните: git rm --cached authorized_key.json" -ForegroundColor Yellow
    exit 1
}

# Проверка, что нет других потенциальных секретных файлов
$sensitivePatterns = @("*secret*", "*password*", "*key*", "*credential*")
foreach ($pattern in $sensitivePatterns) {
    $files = Get-ChildItem -Path . -Recurse -File -Include $pattern -Exclude "*.example", "*.sample", "*.md", "*.js", "*.ts", "*.json"
    if ($files) {
        Write-Host "WARNING: Найдены файлы, которые могут содержать секретные данные:" -ForegroundColor Yellow
        $files | ForEach-Object { Write-Host "  - $_" }
        Write-Host "Пожалуйста, проверьте эти файлы перед отправкой в репозиторий." -ForegroundColor Yellow
    }
}

# Проверка на большие бинарные файлы
$largeFiles = Get-ChildItem -Path . -Recurse -File | Where-Object { $_.Length -gt 10485760 }
if ($largeFiles) {
    Write-Host "WARNING: Найдены большие файлы (>10MB), которые не следует отправлять в Git репозиторий:" -ForegroundColor Yellow
    $largeFiles | ForEach-Object { 
        $sizeMB = [math]::Round($_.Length / 1048576, 2)
        Write-Host "  - $($_.FullName) ($sizeMB MB)"
    }
    Write-Host "Рассмотрите возможность добавления их в .gitignore или использования Git LFS." -ForegroundColor Yellow
}

Write-Host "SUCCESS: Проверка завершена. Если выше нет предупреждений, репозиторий готов к отправке." -ForegroundColor Green
Write-Host "Для отправки в новый репозиторий выполните следующие команды:" -ForegroundColor Green
Write-Host "git remote add new-origin https://github.com/Kirill552/ESG.git" -ForegroundColor Cyan
Write-Host "git push -u new-origin main" -ForegroundColor Cyan
