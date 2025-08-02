# ESG-Lite Production Dockerfile
# Multi-stage build для оптимизации размера и безопасности
# Используем distroless для максимальной безопасности в production
# Обновлено для Next.js 15.4.5, React 19.1.0, Tailwind 4.1.11, Prisma 6.13.0

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:22.18.0-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Копируем package files для установки зависимостей
COPY package.json package-lock.json .nvmrc ./
RUN npm ci --only=production --frozen-lockfile

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:22.18.0-alpine AS builder
WORKDIR /app

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Настройка переменных окружения для build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Генерируем Prisma client с новой конфигурацией
RUN npx prisma generate

# Собираем приложение с Next.js 15.4.5
RUN npm run build

# ============================================================================
# Stage 3: Runner (Distroless для максимальной безопасности)
# ============================================================================
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app

# Копируем необходимые файлы с правильными правами
COPY --from=builder --chown=nonroot:nonroot /app/public ./public
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./package.json

# Создаем директории для логов и temp файлов (distroless read-only, но можем монтировать volumes)
USER nonroot

# Копируем Next.js build
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static

# Копируем Prisma schema и сгенерированный client (Prisma 6.13.0)
COPY --from=builder --chown=nonroot:nonroot /app/prisma ./prisma
COPY --from=builder --chown=nonroot:nonroot /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nonroot:nonroot /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nonroot:nonroot /app/node_modules/@prisma ./node_modules/@prisma

# Копируем конфигурационные файлы для новых версий
COPY --from=builder --chown=nonroot:nonroot /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder --chown=nonroot:nonroot /app/next.config.js ./next.config.js
COPY --from=builder --chown=nonroot:nonroot /app/empty-module.js ./empty-module.js

# Копируем worker scripts и библиотеки
COPY --from=builder --chown=nonroot:nonroot /app/workers ./workers
COPY --from=builder --chown=nonroot:nonroot /app/lib ./lib
COPY --from=builder --chown=nonroot:nonroot /app/scripts ./scripts

# Копируем конфигурационные файлы
COPY --from=builder --chown=nonroot:nonroot /app/tessdata ./tessdata

# Настройка environment variables для новых версий
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Открываем порты
EXPOSE 3000

# Команда запуска (будет переопределена в docker-compose)
CMD ["server.js"]
