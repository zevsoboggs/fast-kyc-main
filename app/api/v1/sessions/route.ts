import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

async function authenticateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return { error: 'API key is required', status: 401 };
  }

  const project = await prisma.project.findFirst({
    where: { apiKey },
    include: { user: true },
  });

  if (!project || !project.isActive) {
    return { error: 'Invalid or inactive API key', status: 401 };
  }

  return { project };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { project } = auth;
    const body = await request.json();

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Optional: user data to pre-fill
    const { userId, email, firstName, lastName, metadata } = body;

    // Store session in database (you may want to create a VerificationSession model)
    // For now, we'll create a verification with PENDING status and store session token in metadata
    const verification = await prisma.verification.create({
      data: {
        projectId: project.id,
        externalId: userId || null,
        status: 'PENDING',
        metadata: {
          sessionToken,
          expiresAt: expiresAt.toISOString(),
          email: email || null,
          firstName: firstName || null,
          lastName: lastName || null,
          ...metadata,
        },
      },
    });

    // Generate embed URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const embedUrl = `${baseUrl}/embed/verify/${verification.id}?token=${sessionToken}`;

    return NextResponse.json({
      sessionId: verification.id,
      sessionToken,
      embedUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
