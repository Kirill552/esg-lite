import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { signReportAndFreeze } from '@/lib/report-signing';
import { getUserInternalId } from '@/lib/user-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Приводим Clerk ID к внутреннему ID пользователя из БД
    const internalUserId = await getUserInternalId(userId);
    const result = await signReportAndFreeze({ reportId: id, userId: internalUserId });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('sign-report error:', error);
    return NextResponse.json(
      { error: error?.message || 'Ошибка подписания отчета' },
      { status: 400 }
    );
  }
}


