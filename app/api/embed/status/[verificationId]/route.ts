import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  try {
    const { verificationId } = await params;
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const verification = await prisma.verification.findUnique({
      where: { id: verificationId },
      select: {
        id: true,
        status: true,
        faceMatchScore: true,
        fraudScore: true,
        rejectionReason: true,
        completedAt: true,
        metadata: true,
      },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    // Verify token
    const metadata = verification.metadata as any;
    if (!metadata || metadata.sessionToken !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      verification: {
        id: verification.id,
        status: verification.status,
        faceMatchScore: verification.faceMatchScore,
        fraudScore: verification.fraudScore,
        rejectionReason: verification.rejectionReason,
        completedAt: verification.completedAt,
      },
    });
  } catch (error) {
    console.error('Embed status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
