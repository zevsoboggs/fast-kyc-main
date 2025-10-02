import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: { userId },
      select: { id: true, name: true },
    });

    const projectIds = projects.map(p => p.id);
    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    if (projectIds.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    // Get verifications with activity data
    const verifications = await prisma.verification.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        projectId: true,
        externalId: true,
        firstName: true,
        lastName: true,
        status: true,
        faceMatchScore: true,
        fraudScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format activity entries
    const activities = verifications.map(v => {
      const projectName = projectMap.get(v.projectId) || 'Unknown Project';
      const userName = [v.firstName, v.lastName].filter(Boolean).join(' ') || v.externalId || 'Unknown User';

      let action = '';
      let description = '';

      switch (v.status) {
        case 'APPROVED':
          action = 'Верификация одобрена';
          description = `${userName} успешно прошел верификацию в проекте ${projectName}`;
          break;
        case 'REJECTED':
          action = 'Верификация отклонена';
          description = `${userName} не прошел верификацию в проекте ${projectName}`;
          break;
        case 'MANUAL_REVIEW':
          action = 'Требуется ручная проверка';
          description = `Верификация ${userName} в проекте ${projectName} требует ручной проверки`;
          break;
        case 'PROCESSING':
          action = 'Обработка верификации';
          description = `Верификация ${userName} в проекте ${projectName} обрабатывается`;
          break;
        case 'PENDING':
          action = 'Новая верификация';
          description = `Создана новая верификация для ${userName} в проекте ${projectName}`;
          break;
        default:
          action = 'Верификация обновлена';
          description = `Статус верификации ${userName} в проекте ${projectName} изменен`;
      }

      return {
        id: v.id,
        action,
        description,
        status: v.status,
        projectName,
        userName,
        externalId: v.externalId,
        faceMatchScore: v.faceMatchScore,
        fraudScore: v.fraudScore,
        timestamp: v.updatedAt,
        createdAt: v.createdAt,
      };
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
