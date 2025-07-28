/**
 * Проверка конфигурации Yandex Cloud Monitoring
 * Быстрая диагностика настроек без отправки данных
 */

import * as fs from 'fs';
import * as path from 'path';

function checkYandexMonitoringConfig() {
  console.log('🔍 Проверка конфигурации Yandex Cloud Monitoring\n');

  const issues = [];
  const warnings = [];

  // 1. Проверка переменных окружения
  console.log('1️⃣ Переменные окружения:');
  const requiredEnvVars = {
    'YANDEX_CLOUD_FOLDER_ID': process.env.YANDEX_CLOUD_FOLDER_ID,
    'YANDEX_CLOUD_SA_KEY_FILE': process.env.YANDEX_CLOUD_SA_KEY_FILE,
    'YANDEX_MONITORING_ENABLED': process.env.YANDEX_MONITORING_ENABLED
  };

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      console.log(`   ✅ ${key}: ${value}`);
    } else {
      console.log(`   ❌ ${key}: НЕ ЗАДАН`);
      issues.push(`Переменная ${key} не задана`);
    }
  }

  // 2. Проверка файла ключа Service Account
  console.log('\n2️⃣ Файл ключа Service Account:');
  const keyFilePath = process.env.YANDEX_CLOUD_SA_KEY_FILE || 'authorized_key.json';
  const fullKeyPath = path.resolve(keyFilePath);
  
  if (fs.existsSync(fullKeyPath)) {
    console.log(`   ✅ Файл найден: ${fullKeyPath}`);
    
    try {
      const keyContent = JSON.parse(fs.readFileSync(fullKeyPath, 'utf8'));
      console.log(`   ✅ JSON корректен`);
      
      // Проверка обязательных полей
      const requiredFields = ['id', 'service_account_id', 'private_key', 'public_key'];
      for (const field of requiredFields) {
        if (keyContent[field]) {
          console.log(`   ✅ Поле ${field}: присутствует`);
        } else {
          console.log(`   ❌ Поле ${field}: отсутствует`);
          issues.push(`В ключе отсутствует поле ${field}`);
        }
      }
      
      // Проверка Service Account ID
      if (keyContent.service_account_id) {
        console.log(`   📝 Service Account ID: ${keyContent.service_account_id}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Ошибка чтения JSON: ${error instanceof Error ? error.message : String(error)}`);
      issues.push('Файл ключа содержит некорректный JSON');
    }
  } else {
    console.log(`   ❌ Файл не найден: ${fullKeyPath}`);
    issues.push('Файл ключа Service Account не найден');
  }

  // 3. Проверка FOLDER_ID
  console.log('\n3️⃣ FOLDER_ID:');
  const folderId = process.env.YANDEX_CLOUD_FOLDER_ID;
  if (folderId) {
    if (folderId.startsWith('b1g') && folderId.length > 10) {
      console.log(`   ✅ Формат FOLDER_ID корректен: ${folderId}`);
    } else {
      console.log(`   ⚠️  Возможно некорректный FOLDER_ID: ${folderId}`);
      warnings.push('FOLDER_ID не соответствует обычному формату Yandex Cloud (b1g...)');
    }
  }

  // 4. Проверка состояния мониторинга
  console.log('\n4️⃣ Состояние мониторинга:');
  const monitoringEnabled = process.env.YANDEX_MONITORING_ENABLED === 'true';
  if (monitoringEnabled) {
    console.log('   ✅ Мониторинг включен');
  } else {
    console.log('   ⚠️  Мониторинг отключен');
    warnings.push('Для активации установите YANDEX_MONITORING_ENABLED=true');
  }

  // 5. Проверка дополнительных настроек
  console.log('\n5️⃣ Дополнительные настройки:');
  const interval = process.env.YANDEX_MONITORING_INTERVAL || '300000';
  const pgInterval = process.env.YANDEX_MONITORING_PG_INTERVAL || '600000';
  
  console.log(`   📊 Интервал отправки метрик: ${parseInt(interval) / 1000 / 60} минут`);
  console.log(`   🐘 Интервал PostgreSQL метрик: ${parseInt(pgInterval) / 1000 / 60} минут`);

  // Итоговый отчет
  console.log('\n' + '='.repeat(50));
  if (issues.length === 0) {
    console.log('🎉 Конфигурация выглядит корректной!');
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Предупреждения:');
      warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log('\n📋 Следующие шаги:');
    console.log('   1. Настройте права Service Account через веб-интерфейс');
    console.log('   2. Запустите тест: npm run test:yandex-monitoring');
    console.log('   3. Проверьте метрики в Yandex Cloud Console');
    
  } else {
    console.log('❌ Найдены проблемы конфигурации:');
    issues.forEach(issue => console.log(`   • ${issue}`));
    
    console.log('\n🔧 Рекомендации:');
    console.log('   1. Проверьте файл .env');
    console.log('   2. Убедитесь, что authorized_key.json создан корректно');
    console.log('   3. См. документацию: docs/YANDEX_MONITORING_PERMISSIONS.md');
  }
}

// Запуск проверки
if (require.main === module) {
  checkYandexMonitoringConfig();
}

export { checkYandexMonitoringConfig };
