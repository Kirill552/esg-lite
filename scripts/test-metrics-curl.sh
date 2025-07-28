#!/bin/bash

# Тест API метрик через curl
# Запустите сначала: npm run dev

echo "🧪 Тестирование API метрик через curl"
echo ""

BASE_URL="http://localhost:3000"

# 1. Базовые метрики
echo "📊 1. Получение базовых метрик"
curl -s "$BASE_URL/api/queue/metrics" | jq '.' || echo "❌ Ошибка получения базовых метрик"
echo ""

# 2. Метрики с параметрами
echo "📈 2. Метрики за 12 часов с лимитом 50"
curl -s "$BASE_URL/api/queue/metrics?period=12&limit=50" | jq '.data.period, .data.summary' || echo "❌ Ошибка получения метрик с параметрами"
echo ""

# 3. Метрики по типу
echo "🔍 3. Метрики времени обработки"
curl -s "$BASE_URL/api/queue/metrics?type=processing_time&limit=5" | jq '.data.type, .data.count' || echo "❌ Ошибка получения метрик по типу"
echo ""

# 4. Валидация - неверный период
echo "⚠️ 4. Тест валидации - неверный период"
curl -s "$BASE_URL/api/queue/metrics?period=200" | jq '.error' || echo "❌ Ошибка валидации периода"
echo ""

# 5. Валидация - неверный тип
echo "⚠️ 5. Тест валидации - неверный тип"
curl -s "$BASE_URL/api/queue/metrics?type=invalid" | jq '.error' || echo "❌ Ошибка валидации типа"
echo ""

# 6. Очистка метрик
echo "🧹 6. Очистка устаревших метрик"
curl -s -X POST "$BASE_URL/api/queue/metrics?action=cleanup" | jq '.message' || echo "❌ Ошибка очистки метрик"
echo ""

echo "🎉 Тестирование через curl завершено!"