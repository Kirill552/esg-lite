import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { VersionManager } from '@/lib/versioning';
import { getActiveEmissionFactors } from '@/lib/emission-factors-service';

export interface ReportSigningResult {
  snapshotId: string;
  signature: string;
  dataHash: string;
}

export async function signReportAndFreeze(params: {
  reportId: string;
  userId: string;
}): Promise<ReportSigningResult> {
  // Берем необходимые поля напрямую сырым SQL, чтобы не зависеть от устаревших типов Prisma
  const rows = (await prisma.$queryRawUnsafe<any[]>(
    'SELECT id, "userId", "fileName", methodology, "emissionData", COALESCE("isLocked", false) AS "isLocked", COALESCE("version", 1) AS "version" FROM "reports" WHERE id = $1',
    params.reportId
  ));

  const report = rows[0];
  if (!report) throw new Error('Отчет не найден');
  if (report.userId !== params.userId) throw new Error('Нет доступа');
  if (report.isLocked) throw new Error('Отчет уже подписан и заморожен');

  // Версии методик/факторов
  const methodVersion = (report.methodology as string)?.includes('CBAM') ? 'CBAM-2025' : '296-FZ-2025';
  const activeFactors = await getActiveEmissionFactors();
  const factorVersions: string[] = activeFactors?.version ? [activeFactors.version] : [];

  const dataHash = VersionManager.generateInputDataHash(report.emissionData as any);

  const snapshotId = crypto.randomUUID();

  const payload = {
    reportId: report.id,
    version: report.version as number,
    fileName: report.fileName as string,
    methodology: report.methodology as string,
    methodVersions: [methodVersion],
    factorVersions,
    dataHash,
    createdAt: new Date().toISOString()
  };

  const signature = crypto
    .createHmac('sha256', process.env.SNAPSHOT_SIGNING_SECRET || 'dev-secret')
    .update(JSON.stringify(payload))
    .digest('hex');

  await prisma.$transaction(async (tx) => {
    // Вставка снапшота сырым SQL
    await tx.$executeRawUnsafe(
      'INSERT INTO "report_snapshots" (id, "reportId", "version", "dataHash", "methodVersions", "factorVersions", "signedBy", "signature", "payload") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      snapshotId,
      report.id,
      report.version,
      dataHash,
      [methodVersion],
      factorVersions,
      params.userId,
      signature,
      payload as any
    );

    // Обновление отчета: блокировка и связь со снапшотом
    await tx.$executeRawUnsafe(
      'UPDATE "reports" SET "isLocked" = true, "signedAt" = NOW(), "signedBy" = $1, "dataHash" = $2, "currentSnapshotId" = $3 WHERE id = $4',
      params.userId,
      dataHash,
      snapshotId,
      report.id
    );
  });

  return { snapshotId, signature, dataHash };
}


