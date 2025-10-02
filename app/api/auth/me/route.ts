import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, unauthorizedResponse } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateUser(request);

  if (error || !user) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!userData) {
      return unauthorizedResponse('User not found');
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}