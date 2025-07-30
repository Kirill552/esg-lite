#!/bin/bash

# Скрипт для настройки SSL сертификата Let's Encrypt для esg-lite.ru

echo "🔐 Настройка SSL сертификата для esg-lite.ru..."

# Создаем необходимые директории
sudo mkdir -p /etc/letsencrypt /var/www/certbot
sudo chown -R deploy:deploy /etc/letsencrypt /var/www/certbot

# Сначала запускаем nginx с самоподписанным сертификатом
echo "📋 Генерируем временный самоподписанный сертификат..."
mkdir -p ./ssl
openssl genrsa -out ./ssl/nginx-selfsigned.key 2048
openssl req -new -x509 -key ./ssl/nginx-selfsigned.key \
  -out ./ssl/nginx-selfsigned.crt -days 365 \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=ESG-Lite/CN=esg-lite.ru"

# Временно меняем nginx конфигурацию на самоподписанный сертификат
cp nginx.conf nginx.conf.backup
sed -i 's|ssl_certificate /etc/letsencrypt/live/esg-lite.ru/fullchain.pem;|ssl_certificate /app/ssl/nginx-selfsigned.crt;|g' nginx.conf
sed -i 's|ssl_certificate_key /etc/letsencrypt/live/esg-lite.ru/privkey.pem;|ssl_certificate_key /app/ssl/nginx-selfsigned.key;|g' nginx.conf

echo "🚀 Запускаем nginx с временным сертификатом..."
docker compose -f docker-compose.prod.yml up -d nginx

# Ждем запуска nginx
sleep 10

echo "📜 Получаем Let's Encrypt сертификат..."
# Замените на ваш реальный email
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email ваш-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d esg-lite.ru \
  -d www.esg-lite.ru

if [ $? -eq 0 ]; then
    echo "✅ SSL сертификат успешно получен!"
    
    # Восстанавливаем оригинальную конфигурацию nginx
    cp nginx.conf.backup nginx.conf
    
    # Перезапускаем nginx с настоящим сертификатом
    docker compose -f docker-compose.prod.yml restart nginx
    
    echo "🎉 SSL настроен! Сайт доступен по https://esg-lite.ru"
else
    echo "❌ Ошибка получения SSL сертификата"
    echo "🔧 Проверьте что домен esg-lite.ru указывает на этот сервер"
    echo "🔧 IP сервера: $(curl -s ifconfig.me)"
fi

# Настраиваем автообновление сертификата
echo "⏰ Настраиваем автообновление сертификата..."
(crontab -l 2>/dev/null; echo "0 12 * * * /opt/esg-lite/scripts/renew-ssl.sh") | crontab -

echo "✅ Настройка SSL завершена!"