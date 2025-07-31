# Скрипт для управления миграциями Prisma
# Автоматически создает SSH туннель и применяет миграции

param(
    [Parameter(Position=0)]
    [ValidateSet("status", "deploy", "reset", "resolve")]
    [string]$Action = "status",
    
    [Parameter(Position=1)]
    [string]$MigrationName = ""
)

function Write-ColorText {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Start-DatabaseTunnel {
    Write-ColorText "Проверяем SSH туннель к базе данных..." "Blue"
    
    # Проверяем, запущен ли туннель
    $tunnel = Get-Process -Name "ssh" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*5433:176.108.253.195:5432*" }
    
    if (-not $tunnel) {
        Write-ColorText "Запускаем SSH туннель..." "Yellow"
        $sshArgs = @(
            "-L", "5433:176.108.253.195:5432",
            "-N",
            "-f",
            "root@82.202.156.35"
        )
        
        try {
            Start-Process -FilePath "ssh" -ArgumentList $sshArgs -WindowStyle Hidden
            Start-Sleep -Seconds 3
            Write-ColorText "SSH туннель запущен (localhost:5433 -> VM1:5432)" "Green"
        }
        catch {
            Write-ColorText "Ошибка запуска SSH туннеля: $_" "Red"
            exit 1
        }
    }
    else {
        Write-ColorText "SSH туннель уже запущен" "Green"
    }
}

function Test-DatabaseConnection {
    Write-ColorText "Проверяем подключение к базе данных..." "Blue"
    
    # Проверяем наличие переменной окружения
    if (-not $env:DEV_DATABASE_URL) {
        Write-ColorText "❌ Переменная DEV_DATABASE_URL не установлена!" "Red"
        Write-ColorText "Установите переменную окружения:" "Yellow"
        Write-ColorText '$env:DEV_DATABASE_URL="postgresql://esg_user:PASSWORD@localhost:5433/esg_lite_mvp?sslmode=disable"' "Yellow"
        return $false
    }
    
    try {
        npx prisma db pull --print 2>&1 | Out-Null
        Write-ColorText "Подключение к базе данных успешно" "Green"
        return $true
    }
    catch {
        Write-ColorText "Не удается подключиться к базе данных" "Red"
        return $false
    }
}

# Главная логика
Write-ColorText "Управление миграциями Prisma" "Blue"
Write-ColorText "Действие: $Action" "Yellow"

# Запускаем туннель
Start-DatabaseTunnel

# Проверяем подключение
if (-not (Test-DatabaseConnection)) {
    Write-ColorText "Завершаем работу из-за проблем с подключением" "Red"
    exit 1
}

# Используем переменную окружения для подключения к базе данных
if (-not $env:DEV_DATABASE_URL) {
    Write-ColorText "❌ Переменная DEV_DATABASE_URL не установлена!" "Red"
    exit 1
}

$env:DATABASE_URL = $env:DEV_DATABASE_URL

# Выполняем действие
switch ($Action) {
    "status" {
        Write-ColorText "Проверяем статус миграций..." "Blue"
        npx prisma migrate status
    }
    
    "deploy" {
        Write-ColorText "Применяем миграции..." "Blue"
        npx prisma migrate deploy
    }
    
    "reset" {
        Write-ColorText "ВНИМАНИЕ: Это удалит все данные в базе!" "Red"
        $confirm = Read-Host "Вы уверены? (yes/no)"
        if ($confirm -eq "yes") {
            npx prisma migrate reset --force
        }
        else {
            Write-ColorText "Операция отменена" "Yellow"
        }
    }
    
    "resolve" {
        if ([string]::IsNullOrEmpty($MigrationName)) {
            Write-ColorText "Укажите название миграции для resolve" "Red"
            Write-ColorText "Пример: .\scripts\migrate.ps1 resolve 20250131000000_init" "Yellow"
            exit 1
        }
        
        Write-ColorText "Отмечаем миграцию как примененную: $MigrationName" "Blue"
        npx prisma migrate resolve --applied $MigrationName
    }
}

Write-ColorText "Операция завершена" "Green"
