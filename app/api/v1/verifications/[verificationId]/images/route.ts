import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, unauthorizedResponse } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { getSignedDownloadUrl } from '@/lib/aws/s3';

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
        projectId: true,
        documentFrontS3Key: true,
        documentBackS3Key: true,
        selfieS3Key: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (verification.projectId !== project.id) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    const images: any = {};

    // Generate signed URLs for each image (1 hour expiry)
    if (verification.documentFrontS3Key) {
      try {
        images.documentFront = await getSignedDownloadUrl(verification.documentFrontS3Key, 3600);
      } catch (err) {
        console.error('Failed to get documentFront URL:', err);
      }
    }

    if (verification.documentBackS3Key) {
      try {
        images.documentBack = await getSignedDownloadUrl(verification.documentBackS3Key, 3600);
      } catch (err) {
        console.error('Failed to get documentBack URL:', err);
      }
    }

    if (verification.selfieS3Key) {
      try {
        images.selfie = await getSignedDownloadUrl(verification.selfieS3Key, 3600);
      } catch (err) {
        console.error('Failed to get selfie URL:', err);
      }
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Get verification images error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification images' },
      { status: 500 }
    );
  }
}
