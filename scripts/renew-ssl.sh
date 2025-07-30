#!/bin/bash

# Скрипт для автоматического обновления SSL сертификата

echo "🔄 Проверяем и обновляем SSL сертификат..."

cd /opt/esg-lite

# Обновляем сертификат
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot renew --quiet

# Если сертификат обновился, перезапускаем nginx
if [ $? -eq 0 ]; then
    echo "✅ Сертификат проверен/обновлен"
    docker compose -f docker-compose.prod.yml restart nginx
    echo "🔄 Nginx перезапущен"
else
    echo "⚠️ Проблема с обновлением сертификата"
fi