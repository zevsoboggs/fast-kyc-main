import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Get user's projects with webhook settings
    const projects = await prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        webhookUrl: true,
        webhookSecret: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Webhooks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const body = await request.json();
    const { projectId, webhookUrl, webhookSecret } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate webhook secret if not provided
    const secret = webhookSecret || crypto.randomBytes(32).toString('hex');

    // Update project webhook settings
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        webhookUrl: webhookUrl || null,
        webhookSecret: webhookUrl ? secret : null,
      },
      select: {
        id: true,
        name: true,
        webhookUrl: true,
        webhookSecret: true,
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Webhook update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
