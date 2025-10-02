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
      select: { id: true },
    });

    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json({
        totalVerifications: 0,
        approvedVerifications: 0,
        rejectedVerifications: 0,
        pendingVerifications: 0,
        averageFaceMatchScore: 0,
        averageFraudScore: 0,
        verificationsByStatus: [],
        verificationsByDay: [],
        verificationsByProject: [],
      });
    }

    // Total verifications
    const totalVerifications = await prisma.verification.count({
      where: { projectId: { in: projectIds } },
    });

    // Verifications by status
    const statusCounts = await prisma.verification.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: { status: true },
    });

    const approved = statusCounts.find(s => s.status === 'APPROVED')?._count.status || 0;
    const rejected = statusCounts.find(s => s.status === 'REJECTED')?._count.status || 0;
    const pending = statusCounts.find(s => s.status === 'PENDING')?._count.status || 0;
    const processing = statusCounts.find(s => s.status === 'PROCESSING')?._count.status || 0;
    const manualReview = statusCounts.find(s => s.status === 'MANUAL_REVIEW')?._count.status || 0;

    // Average scores
    const scores = await prisma.verification.aggregate({
      where: {
        projectId: { in: projectIds },
        status: { in: ['APPROVED', 'REJECTED'] },
      },
      _avg: {
        faceMatchScore: true,
        fraudScore: true,
      },
    });

    // Verifications by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const verificationsByDay = await prisma.verification.groupBy({
      by: ['createdAt'],
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    // Group by day
    const dayMap = new Map<string, number>();
    verificationsByDay.forEach(v => {
      const day = v.createdAt.toISOString().split('T')[0];
      dayMap.set(day, (dayMap.get(day) || 0) + v._count.id);
    });

    const verificationsByDayArray = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Verifications by project
    const verificationsByProject = await prisma.verification.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds } },
      _count: { id: true },
    });

    const projectsWithCounts = await Promise.all(
      verificationsByProject.map(async (vp) => {
        const project = await prisma.project.findUnique({
          where: { id: vp.projectId },
          select: { name: true },
        });
        return {
          projectId: vp.projectId,
          projectName: project?.name || 'Unknown',
          count: vp._count.id,
        };
      })
    );

    return NextResponse.json({
      totalVerifications,
      approvedVerifications: approved,
      rejectedVerifications: rejected,
      pendingVerifications: pending + processing + manualReview,
      averageFaceMatchScore: scores._avg.faceMatchScore || 0,
      averageFraudScore: scores._avg.fraudScore || 0,
      verificationsByStatus: statusCounts.map(s => ({
        status: s.status,
        count: s._count.status,
      })),
      verificationsByDay: verificationsByDayArray,
      verificationsByProject: projectsWithCounts,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
