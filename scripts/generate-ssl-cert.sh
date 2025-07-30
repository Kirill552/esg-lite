#!/bin/bash

# Скрипт для генерации самоподписанного SSL сертификата
# Используется временно до настройки Let's Encrypt

echo "🔐 Генерируем самоподписанный SSL сертификат..."

# Создаем директории
sudo mkdir -p /etc/ssl/certs /etc/ssl/private

# Генерируем приватный ключ
sudo openssl genrsa -out /etc/ssl/private/nginx-selfsigned.key 2048

# Генерируем сертификат
sudo openssl req -new -x509 -key /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt -days 365 \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=ESG-Lite/CN=localhost"

# Устанавливаем права
sudo chmod 600 /etc/ssl/private/nginx-selfsigned.key
sudo chmod 644 /etc/ssl/certs/nginx-selfsigned.crt

echo "✅ SSL сертификат создан!"
echo "📁 Приватный ключ: /etc/ssl/private/nginx-selfsigned.key"
echo "📁 Сертификат: /etc/ssl/certs/nginx-selfsigned.crt"