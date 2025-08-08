-- Добавление полей подписи и блокировки в reports
ALTER TABLE IF EXISTS reports
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS "signedBy" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "dataHash" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "currentSnapshotId" TEXT NULL;

-- Создание таблицы report_snapshots
CREATE TABLE IF NOT EXISTS report_snapshots (
  id TEXT PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  "dataHash" TEXT NOT NULL,
  "methodVersions" TEXT[] NOT NULL,
  "factorVersions" TEXT[] NOT NULL,
  "signedBy" TEXT NOT NULL,
  "signedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signature TEXT NOT NULL,
  payload JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS report_snapshots_reportId_version_idx ON report_snapshots ("reportId", version);

-- Внешний ключ
ALTER TABLE report_snapshots
  ADD CONSTRAINT IF NOT EXISTS report_snapshots_report_fk
  FOREIGN KEY ("reportId") REFERENCES reports(id) ON DELETE CASCADE;


