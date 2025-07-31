import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// DELETE - удаление отчета
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем, что отчет принадлежит пользователю
    const report = await prisma.report.findFirst({
      where: { id, userId }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Удаляем отчет
    await prisma.report.delete({
      where: { id }
    });

    console.log(`🗑️ Отчет удален: ${id}`);

    return NextResponse.json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error('Ошибка удаления отчета:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления отчета' },
      { status: 500 }
    );
  }
} 