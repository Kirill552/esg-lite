// Prisma Config для 2025 - правильная конфигурация для Prisma 6.13.0
import "dotenv/config"; // Обязательно для загрузки .env переменных
import type { PrismaConfig } from "prisma";

export default {
  // Путь к схеме Prisma (по умолчанию ./prisma/schema.prisma)
  schema: "prisma/schema.prisma",
  
  // Конфигурация миграций
  migrations: {
    path: "prisma/migrations",
  },
} satisfies PrismaConfig;
