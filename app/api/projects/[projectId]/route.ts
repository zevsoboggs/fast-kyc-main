import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, unauthorizedResponse, forbiddenResponse } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { createAuditLog } from '@/lib/utils/auditLog';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  webhookUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { user, error } = await authenticateUser(request);

  if (error || !user) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: { verifications: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (project.userId !== user.userId) {
      return forbiddenResponse('Access denied');
    }

    // Don't expose the hash, but include apiKey for owner
    const { apiKeyHash, ...projectData } = project;

    return NextResponse.json({ project: projectData });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Failed to get project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { user, error } = await authenticateUser(request);

  if (error || !user) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const { projectId } = await params;
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    // Check ownership
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (existingProject.userId !== user.userId) {
      return forbiddenResponse('Access denied');
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: validated,
      select: {
        id: true,
        name: true,
        description: true,
        webhookUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.userId,
      action: 'PROJECT_UPDATED',
      details: { projectId, changes: validated },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { user, error } = await authenticateUser(request);

  if (error || !user) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const { projectId } = await params;

    // Check ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== user.userId) {
      return forbiddenResponse('Access denied');
    }

    // Delete project (will cascade delete verifications)
    await prisma.project.delete({
      where: { id: projectId },
    });

    // Create audit log
    await createAuditLog({
      userId: user.userId,
      action: 'PROJECT_DELETED',
      details: { projectId, projectName: project.name },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}