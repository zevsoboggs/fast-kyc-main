import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { uploadToS3 } from '@/lib/aws/s3';
import { startVerificationWorkflow } from '@/lib/aws/step-functions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const verificationId = formData.get('verificationId') as string;
    const token = formData.get('token') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const documentFront = formData.get('documentFront') as File;
    const documentBack = formData.get('documentBack') as File | null;
    const selfie = formData.get('selfie') as File;

    if (!verificationId || !token) {
      return NextResponse.json({ error: 'Verification ID and token are required' }, { status: 400 });
    }

    if (!documentFront || !selfie) {
      return NextResponse.json({ error: 'Document front and selfie are required' }, { status: 400 });
    }

    // Verify session
    const verification = await prisma.verification.findUnique({
      where: { id: verificationId },
      include: { project: true },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    const metadata = verification.metadata as any;
    if (!metadata || metadata.sessionToken !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check expiry
    if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Upload files to S3
    const documentFrontBuffer = Buffer.from(await documentFront.arrayBuffer());
    const selfieBuffer = Buffer.from(await selfie.arrayBuffer());

    const documentFrontKey = await uploadToS3(
      documentFrontBuffer,
      `verifications/${verificationId}/document-front-${Date.now()}.${documentFront.type.split('/')[1]}`,
      documentFront.type
    );

    const selfieKey = await uploadToS3(
      selfieBuffer,
      `verifications/${verificationId}/selfie-${Date.now()}.${selfie.type.split('/')[1]}`,
      selfie.type
    );

    let documentBackKey: string | null = null;
    if (documentBack) {
      const documentBackBuffer = Buffer.from(await documentBack.arrayBuffer());
      documentBackKey = await uploadToS3(
        documentBackBuffer,
        `verifications/${verificationId}/document-back-${Date.now()}.${documentBack.type.split('/')[1]}`,
        documentBack.type
      );
    }

    // Update verification
    const updatedVerification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        documentFrontS3Key: documentFrontKey,
        documentBackS3Key: documentBackKey,
        selfieS3Key: selfieKey,
        status: 'PROCESSING',
      },
    });

    // Start Step Functions workflow
    try {
      const executionArn = await startVerificationWorkflow(verificationId);
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          stepFunctionArn: executionArn,
          stepFunctionStatus: 'RUNNING',
        },
      });
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }

    return NextResponse.json({
      verification: {
        id: updatedVerification.id,
        status: updatedVerification.status,
      },
    });
  } catch (error) {
    console.error('Embed submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
