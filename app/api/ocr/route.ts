import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { processS3File } from '@/lib/ocr';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    console.log('🔍 OCR POST request received:', { documentId, userId });

    // Находим документ в БД
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        user: { clerkId: userId }
      },
      include: {
        user: true
      }
    });
    
    if (!document) {
      return NextResponse.json({
        success: false,
        error: 'Document not found'
      }, { status: 404 });
    }

    console.log('🔍 Найден документ для OCR:', { documentId, fileName: document.fileName });

    try {
      // Обновляем статус документа
      await prisma.document.update({
        where: { id: documentId },
        data: { 
          status: 'PROCESSING',
          ocrProcessed: false
        }
      });

      // filePath уже содержит fileKey
      const fileKey = document.filePath;
      console.log('🚀 Запускаем OCR обработку для файла:', fileKey);
       
      const text = await processS3File(fileKey);
      
      console.log('✅ OCR обработка завершена успешно. Длина текста:', text.length);
      console.log('📄 Первые 100 символов:', text.substring(0, 100));
      
      // Сохраняем результат в БД
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'PROCESSED',
          ocrProcessed: true,
          ocrData: {
            fullText: text,
            textPreview: text.substring(0, 200),
            textLength: text.length,
            processedAt: new Date().toISOString()
          },
          ocrConfidence: 0.95 // Примерная точность
        }
      });
      
      console.log('💾 OCR результат сохранен в БД');

      return NextResponse.json({
        success: true,
        data: {
          documentId,
          preview: text.substring(0, 200),
          textLength: text.length,
          processedAt: new Date().toISOString()
        }
      });

    } catch (ocrError: any) {
      console.error('❌ OCR обработка неудачна:', ocrError.message);
      
      // Сохраняем ошибку в БД
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          ocrData: {
            error: ocrError.message,
            processedAt: new Date().toISOString()
          }
        }
      });

      return NextResponse.json({
        success: false,
        error: ocrError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ OCR API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Находим документ в БД
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        user: { clerkId: userId }
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log('🔍 OCR GET request for documentId:', documentId);
    console.log('📄 Document OCR status:', document.ocrProcessed);

    if (!document.ocrProcessed || !document.ocrData) {
      return NextResponse.json({
        success: true,
        data: {
          documentId,
          status: 'not_started',
        }
      });
    }

    const ocrData = document.ocrData as any;
    
    return NextResponse.json({
      success: true,
      data: {
        documentId,
        status: document.status === 'PROCESSED' ? 'completed' : 'failed',
        textPreview: ocrData.textPreview,
        textLength: ocrData.textLength,
        error: ocrData.error,
        processedAt: ocrData.processedAt
      }
    });

  } catch (error: any) {
    console.error('❌ API Error in OCR GET route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 