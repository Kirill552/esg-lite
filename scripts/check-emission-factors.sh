#!/bin/bash
# Cron скрипт для автоматической проверки обновлений коэффициентов 296-ФЗ
# Добавить в crontab: 0 2 1 * * /opt/esg-lite/scripts/check-emission-factors.sh

set -e

# Конфигурация
PROJECT_DIR="/opt/esg-lite"
LOG_FILE="/var/log/esg-lite/emission-factors-check.log"
NOTIFICATION_EMAIL="admin@esg-lite.ru"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Создаем директорию для логов если не существует
mkdir -p "$(dirname "$LOG_FILE")"

log "🔍 Запуск проверки актуальности коэффициентов 296-ФЗ"

cd "$PROJECT_DIR"

# Проверяем актуальность коэффициентов
if node scripts/update-emission-factors.js --check; then
    log "✅ Коэффициенты актуальны, обновление не требуется"
    exit 0
else
    log "⚠️ Обнаружены устаревшие коэффициенты"
    
    # Отправляем уведомление (требует настройки sendmail или postfix)
    if command -v sendmail >/dev/null 2>&1; then
        {
            echo "Subject: [ESG-Lite] Требуется обновление коэффициентов 296-ФЗ"
            echo "From: noreply@esg-lite.ru"
            echo "To: $NOTIFICATION_EMAIL"
            echo ""
            echo "Обнаружены устаревшие коэффициенты выбросов парниковых газов."
            echo ""
            echo "Для обновления выполните:"
            echo "1. cd $PROJECT_DIR"
            echo "2. node scripts/update-emission-factors.js"
            echo "3. Примените миграции к базе данных"
            echo "4. Перезапустите приложение"
            echo ""
            echo "Логи: $LOG_FILE"
            echo ""
            echo "Время проверки: $(date)"
        } | sendmail "$NOTIFICATION_EMAIL"
        
        log "📧 Уведомление отправлено на $NOTIFICATION_EMAIL"
    else
        log "⚠️ sendmail не настроен, уведомление не отправлено"
    fi
    
    exit 1
fi
