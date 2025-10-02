import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, unauthorizedResponse } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  const { project, error } = await authenticateApiKey(request);

  if (error || !project) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const { verificationId } = await params;

    const verification = await prisma.verification.findUnique({
      where: { id: verificationId },
      select: {
        id: true,
        externalId: true,
        status: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        nationality: true,
        documentNumber: true,
        documentType: true,
        documentFrontS3Key: true,
        documentBackS3Key: true,
        selfieS3Key: true,
        faceMatchScore: true,
        faceMatchConfidence: true,
        livenessScore: true,
        livenessConfidence: true,
        fraudScore: true,
        fraudRiskLevel: true,
        fraudReasons: true,
        ocrData: true,
        mrzData: true,
        rejectionReason: true,
        ipAddress: true,
        userAgent: true,
        deviceInfo: true,
        ipGeoLocation: true,
        sessionEvents: true,
        createdAt: true,
        completedAt: true,
        metadata: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const verificationProject = await prisma.verification.findFirst({
      where: { id: verificationId, projectId: project.id },
    });

    if (!verificationProject) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ verification });
  } catch (error) {
    console.error('Get verification error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification' },
      { status: 500 }
    );
  }
}