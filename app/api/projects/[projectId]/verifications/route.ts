import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { projectId } = await params;

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: decoded.userId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get verifications for this project
    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where: {
          projectId: projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          externalId: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          nationality: true,
          documentNumber: true,
          documentType: true,
          documentFrontS3Key: true,
          documentBackS3Key: true,
          selfieS3Key: true,
          fraudScore: true,
          fraudRiskLevel: true,
          fraudReasons: true,
          faceMatchScore: true,
          faceMatchConfidence: true,
          rejectionReason: true,
          ocrData: true,
          mrzData: true,
          ipAddress: true,
          userAgent: true,
          deviceInfo: true,
          ipGeoLocation: true,
          sessionEvents: true,
          createdAt: true,
          updatedAt: true,
          completedAt: true,
        },
      }),
      prisma.verification.count({
        where: {
          projectId: projectId,
        },
      }),
    ]);

    return NextResponse.json({
      verifications,
      total,
    });
  } catch (error: any) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
