import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSignedUploadUrl } from '../../../../lib/s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * Генерация временного URL для загрузки файла
 * POST /api/files/upload-url
 * Body: { fileName: string, contentType: string, fileSize?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileName, contentType, fileSize, expiration = 3600 } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (если передан)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Генерируем уникальный ключ файла
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = fileName.split('.').pop() || '';
    const fileKey = `uploads/${userId}/${timestamp}-${uuid}.${extension}`;

    // Генерируем подписанный URL для загрузки
    const signedUrl = await getSignedUploadUrl(fileKey, contentType, expiration);

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: signedUrl,
        fileKey,
        fileName,
        contentType,
        expiresIn: expiration,
        expiresAt: new Date(Date.now() + expiration * 1000).toISOString(),
        maxSize,
        instructions: {
          method: 'PUT',
          headers: {
            'Content-Type': contentType
          },
          note: 'Upload the file using PUT method to the uploadUrl'
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload URL generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate upload URL'
      },
      { status: 500 }
    );
  }
}
