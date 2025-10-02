import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { verifyApiKey } from '@/lib/utils/apiKey';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
  project?: any;
}

export async function authenticateUser(request: NextRequest): Promise<{
  user: JWTPayload | null;
  error: string | null;
}> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user) {
    return { user: null, error: 'Invalid or expired token' };
  }

  return { user, error: null };
}

export async function authenticateApiKey(request: NextRequest): Promise<{
  project: any | null;
  error: string | null;
}> {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return { project: null, error: 'Missing API key' };
  }

  try {
    // Find project by API key
    const projects = await prisma.project.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    for (const project of projects) {
      const isValid = await verifyApiKey(apiKey, project.apiKeyHash);
      if (isValid) {
        return { project, error: null };
      }
    }

    return { project: null, error: 'Invalid API key' };
  } catch (error) {
    return { project: null, error: 'Authentication failed' };
  }
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}