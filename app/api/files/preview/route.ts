import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSignedDownloadUrl } from '../../../../lib/s3';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Генерация временного URL для предпросмотра файла
 * GET /api/files/preview?fileKey=path/to/file.pdf&type=document|report&expiration=3600
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const fileKey = url.searchParams.get('fileKey');
    const type = url.searchParams.get('type') || 'document';
    const expiration = parseInt(url.searchParams.get('expiration') || '3600'); // 1 час по умолчанию

    if (!fileKey) {
      return NextResponse.json(
        { success: false, error: 'File key is required' },
        { status: 400 }
      );
    }

    // Проверяем права доступа к файлу
    if (type === 'document') {
      const document = await prisma.document.findFirst({
        where: {
          filePath: fileKey,
          userId: userId
        }
      });

      if (!document) {
        return NextResponse.json(
          { success: false, error: 'Document not found or access denied' },
          { status: 404 }
        );
      }
    } else if (type === 'report') {
      const report = await prisma.report.findFirst({
        where: {
          filePath: fileKey,
          userId: userId
        }
      });

      if (!report) {
        return NextResponse.json(
          { success: false, error: 'Report not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Генерируем подписанный URL
    const signedUrl = await getSignedDownloadUrl(fileKey, expiration);

    return NextResponse.json({
      success: true,
      data: {
        url: signedUrl,
        fileKey,
        expiresIn: expiration,
        expiresAt: new Date(Date.now() + expiration * 1000).toISOString(),
        type
      }
    });

  } catch (error) {
    console.error('❌ File preview error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate preview URL'
      },
      { status: 500 }
    );
  }
}
