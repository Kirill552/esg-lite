import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFile, generateFileKey } from '@/lib/s3';
import { prisma } from '@/lib/prisma';
import { getUserInternalId } from '@/lib/user-utils';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Проверка типа файла
    const allowedTypes = [
      'application/pdf', 
      'text/csv', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла' },
        { status: 400 }
      );
    }

    // Проверка размера файла (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    console.log('📁 Uploading file to S3:', file.name);

    // Загружаем файл в S3
    const fileType = file.type === 'application/pdf' ? 'pdf' : 'csv';
    const fileKey = generateFileKey(file.name, fileType);
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadFile(fileKey, buffer, file.type);

    console.log('✅ File uploaded to S3. URL:', fileUrl);

    // Генерируем уникальный ID для документа
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Используем транзакцию для обеспечения целостности данных
    const result = await prisma.$transaction(async (tx) => {
      // Получаем или создаем пользователя в базе данных
      const internalUserId = await getUserInternalId(userId);

      // Проверяем, что пользователь действительно существует
      const user = await tx.user.findUnique({
        where: { id: internalUserId }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Сохраняем документ в БД
      const document = await tx.document.create({
        data: {
          id: documentId,
          userId: internalUserId,
          fileName: file.name,
          originalName: file.name,
          filePath: fileKey, // Сохраняем постоянный ключ файла
          fileSize: file.size,
          fileType: file.type,
          status: 'UPLOADED'
        }
      });

      return { document, user };
    });
    
    console.log('💾 Document saved to database:', result.document);

    return NextResponse.json({
      success: true,
      data: {
        documentId: result.document.id,
        fileKey,
        fileName: result.document.fileName
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    
    // Детальная обработка ошибок
    if (error instanceof Error) {
      // Ошибки аутентификации пользователя
      if (error.message.includes('Не удалось получить данные пользователя') || 
          error.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Ошибка аутентификации пользователя' },
          { status: 401 }
        );
      }

      // Ошибки S3
      if (error.message.includes('S3') || error.message.includes('upload')) {
        return NextResponse.json(
          { error: 'Ошибка загрузки файла в хранилище' },
          { status: 503 }
        );
      }

      // Ошибки базы данных
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Документ с таким именем уже существует' },
          { status: 409 }
        );
      }

      // Ошибки транзакций
      if (error.message.includes('Transaction')) {
        return NextResponse.json(
          { error: 'Ошибка транзакции базы данных' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Ошибка загрузки файла', details: error.message },
      { status: 500 }
    );
  }
} 