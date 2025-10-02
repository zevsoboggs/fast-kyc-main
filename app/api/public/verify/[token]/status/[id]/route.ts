import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id } = await params;

    // Decode token to get project ID
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [projectId] = decoded.split(':');

    // Find verification
    const verification = await prisma.verification.findFirst({
      where: {
        id,
        projectId,
      },
      select: {
        id: true,
        status: true,
        firstName: true,
        lastName: true,
        documentNumber: true,
        nationality: true,
        dateOfBirth: true,
        faceMatchScore: true,
        fraudScore: true,
        fraudRiskLevel: true,
        rejectionReason: true,
        completedAt: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verification,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
