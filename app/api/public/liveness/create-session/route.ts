import { NextRequest, NextResponse } from 'next/server';
import { createLivenessSession } from '@/lib/aws/liveness';

export async function POST(request: NextRequest) {
  try {
    const { verificationId } = await request.json();

    if (!verificationId) {
      return NextResponse.json(
        { error: 'Verification ID is required' },
        { status: 400 }
      );
    }

    const session = await createLivenessSession();

    return NextResponse.json({
      sessionId: session.sessionId,
      token: session.token,
      message: 'Liveness session created successfully',
    });
  } catch (error) {
    console.error('Create liveness session error:', error);
    return NextResponse.json(
      { error: 'Failed to create liveness session' },
      { status: 500 }
    );
  }
}
