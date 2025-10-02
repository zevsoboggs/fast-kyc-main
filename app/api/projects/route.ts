import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, unauthorizedResponse } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { generateApiKey, hashApiKey, generateWebhookSecret } from '@/lib/utils/apiKey';
import { createAuditLog } from '@/lib/utils/auditLog';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  webhookUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateUser(request);

  if (error || !user) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const projects = await prisma.project.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        name: true,
        description: true,
        apiKey: true,
        webhookUrl: true,
        webhookSecret: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { verifications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to get projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateUser(request);

  if (error || !user) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    // Generate API key
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    // Generate webhook secret if webhook URL provided
    const webhookSecret = validated.webhookUrl ? generateWebhookSecret() : null;

    // Create project
    const project = await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.description,
        userId: user.userId,
        apiKey,
        apiKeyHash,
        webhookUrl: validated.webhookUrl,
        webhookSecret,
      },
      select: {
        id: true,
        name: true,
        description: true,
        apiKey: true,
        webhookUrl: true,
        webhookSecret: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.userId,
      action: 'PROJECT_CREATED',
      details: { projectId: project.id, projectName: project.name },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      project,
      warning: 'Save the API key securely. It will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}