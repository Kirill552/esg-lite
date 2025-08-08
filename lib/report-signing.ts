import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { VersionManager } from '@/lib/versioning';

export interface ReportSigningResult {
  snapshotId: string;
  signature: string;
  dataHash: string;
}

export async function signReportAndFreeze(params: {
  reportId: string;
  userId: string;
}): Promise<ReportSigningResult> {
  const report = await prisma.report.findUnique({ where: { id: params.reportId } });
  if (!report) throw new Error('Отчет не найден');
  if (report.userId !== params.userId) throw new Error('Нет доступа');
  if (report.isLocked) throw new Error('Отчет уже подписан и заморожен');

  const methodVersion = 'v2025-01-01';
  const factorVersions: string[] = [];

  const dataHash = VersionManager.generateInputDataHash(report.emissionData as any);

  const snapshotId = crypto.randomUUID();

  const payload = {
    reportId: report.id,
    version: report.version,
    fileName: report.fileName,
    methodology: report.methodology,
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
    await tx.reportSnapshot.create({
      data: {
        id: snapshotId,
        reportId: report.id,
        version: report.version,
        dataHash,
        methodVersions: [methodVersion],
        factorVersions,
        signedBy: params.userId,
        signature,
        payload
      }
    });

    await tx.report.update({
      where: { id: report.id },
      data: {
        isLocked: true,
        signedAt: new Date(),
        signedBy: params.userId,
        dataHash,
        currentSnapshotId: snapshotId
      }
    });
  });

  return { snapshotId, signature, dataHash };
}


