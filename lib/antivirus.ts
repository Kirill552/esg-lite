import NodeClam from 'clamscan';

let clamd: any | null = null;

export async function getClam(): Promise<any> {
  if (clamd) return clamd;
  const ClamScan = await new (NodeClam as any)().init({
    removeInfected: false,
    quarantineInfected: false,
    clamdscan: {
      socket: process.env.CLAMAV_SOCKET || false,
      host: process.env.CLAMAV_HOST || '127.0.0.1',
      port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
      timeout: 120000,
      localFallback: true,
    },
  });
  clamd = ClamScan;
  return clamd;
}

export async function scanBuffer(buffer: Buffer): Promise<{ isInfected: boolean; viruses: string[] }> {
  const clam = await getClam();
  const { isInfected, viruses } = await clam.scanBuffer(buffer);
  return { isInfected: !!isInfected, viruses: (viruses || []) as string[] };
}


