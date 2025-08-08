-- One-off hotfix: ensure columns and snapshot table exist

-- Add columns to reports
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN DEFAULT FALSE;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP NULL;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "signedBy" TEXT NULL;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "dataHash" TEXT NULL;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "currentSnapshotId" TEXT NULL;

-- Create report_snapshots table if needed
CREATE TABLE IF NOT EXISTS "report_snapshots" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "dataHash" TEXT NOT NULL,
  "methodVersions" TEXT[] NOT NULL,
  "factorVersions" TEXT[] NOT NULL,
  "signedBy" TEXT NOT NULL,
  "signedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signature" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS "report_snapshots_reportId_version_idx"
  ON "report_snapshots" ("reportId", "version");

-- Add FK if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'report_snapshots_report_fk'
      AND table_name = 'report_snapshots'
  ) THEN
    ALTER TABLE "report_snapshots"
      ADD CONSTRAINT "report_snapshots_report_fk"
      FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE;
  END IF;
END $$;


