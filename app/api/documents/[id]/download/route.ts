import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const prisma = new PrismaClient();

// Настройка S3 клиента
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ru-central1',
  endpoint: process.env.AWS_ENDPOINT_URL_S3 || 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Находим документ
    const document = await prisma.document.findFirst({
      where: { id, userId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    try {
      // Скачиваем файл из S3
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'esg-lite-documents',
        Key: document.fileName,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('File not found in storage');
      }

      // Преобразуем stream в buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      
      const fileBuffer = Buffer.concat(chunks);

      // Определяем MIME тип
      const mimeType = response.ContentType || 'application/octet-stream';

      // Возвращаем файл
      const nextResponse = new NextResponse(fileBuffer);
      nextResponse.headers.set('Content-Type', mimeType);
      nextResponse.headers.set('Content-Disposition', `attachment; filename="${document.originalName}"`);
      
      console.log(`📥 Документ скачан: ${document.originalName}`);
      return nextResponse;

    } catch (s3Error) {
      console.error('Ошибка S3:', s3Error);
      return NextResponse.json({ 
        error: 'File not found in storage',
        details: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Ошибка скачивания документа:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
