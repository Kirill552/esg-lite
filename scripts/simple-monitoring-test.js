/**
 * Простой тест Yandex Cloud Monitoring без сборки проекта
 * Тестируем только IAM токены и базовую отправку метрик
 */

// Загружаем переменные из .env файла
require('dotenv').config();

const jwt = require('jsonwebtoken');
const fs = require('fs');

// Получение IAM токена для Service Account
async function getIamToken() {
  const keyFile = process.env.YANDEX_CLOUD_SA_KEY_FILE || 'authorized_key.json';
  
  if (!fs.existsSync(keyFile)) {
    throw new Error(`Файл ключа не найден: ${keyFile}`);
  }

  const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: keyData.service_account_id,
    aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
    iat: now,
    exp: now + 3600 // 1 час
  };

  const jwtToken = jwt.sign(payload, keyData.private_key, {
    algorithm: 'PS256',
    keyid: keyData.id
  });

  console.log('🔑 JWT токен создан');

  const response = await fetch('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jwt: jwtToken
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ошибка получения IAM токена: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✅ IAM токен получен');
  return data.iamToken;
}

// Отправка тестовой метрики
async function sendTestMetric(iamToken) {
  const folderId = process.env.YANDEX_CLOUD_FOLDER_ID;
  
  const metrics = [{
    name: 'esg_lite_test_connection',
    value: 1,
    labels: {
      service: 'esg-lite',
      test: 'true'
    },
    ts: new Date().toISOString()
  }];

  const url = `https://monitoring.api.cloud.yandex.net/monitoring/v2/data/write?folderId=${folderId}&service=custom`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${iamToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      metrics: metrics
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ошибка отправки метрики: ${response.status} ${error}`);
  }

  console.log('📊 Тестовая метрика отправлена');
  return true;
}

async function simpleMonitoringTest() {
  console.log('🧪 Простой тест Yandex Cloud Monitoring\n');

  try {
    // 1. Проверяем конфигурацию
    console.log('1️⃣ Проверка конфигурации...');
    console.log(`   YANDEX_CLOUD_FOLDER_ID: ${process.env.YANDEX_CLOUD_FOLDER_ID || 'НЕ ЗАДАН'}`);
    console.log(`   YANDEX_MONITORING_ENABLED: ${process.env.YANDEX_MONITORING_ENABLED || 'НЕ ЗАДАН'}`);

    if (!process.env.YANDEX_CLOUD_FOLDER_ID) {
      throw new Error('YANDEX_CLOUD_FOLDER_ID не задан');
    }

    // 2. Получаем IAM токен
    console.log('\n2️⃣ Получение IAM токена...');
    const iamToken = await getIamToken();

    // 3. Отправляем тестовую метрику
    console.log('\n3️⃣ Отправка тестовой метрики...');
    await sendTestMetric(iamToken);

    console.log('\n🎉 Тест прошел успешно!');
    console.log('\n📊 Проверьте метрики в Yandex Cloud Console:');
    console.log(`   https://console.cloud.yandex.ru/folders/${process.env.YANDEX_CLOUD_FOLDER_ID}/monitoring`);

  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n🔧 Ошибка доступа (403):');
      console.log('   Service Account не имеет права записи метрик');
      console.log('   Назначьте роль monitoring.editor в Yandex Cloud Console');
    }
    
    if (error.message.includes('401')) {
      console.log('\n🔧 Ошибка аутентификации (401):');
      console.log('   Проблемы с Service Account ключом или токеном');
      console.log('   Проверьте файл authorized_key.json');
    }

    if (error.message.includes('400')) {
      console.log('\n🔧 Ошибка запроса (400):');
      console.log('   Неправильный формат данных или FOLDER_ID');
      console.log('   Проверьте YANDEX_CLOUD_FOLDER_ID');
    }
  }
}

// Запуск теста
if (require.main === module) {
  simpleMonitoringTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { simpleMonitoringTest };
