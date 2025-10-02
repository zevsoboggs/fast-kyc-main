import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { uploadFile } from '@/lib/aws/s3';
import { analyzeID } from '@/lib/aws/textract';
import { compareFaces, detectFaces } from '@/lib/aws/rekognition';
import { checkFraud } from '@/lib/aws/fraudDetector';
import { createAuditLog } from '@/lib/utils/auditLog';
import { sendWebhook } from '@/lib/utils/webhook';
import { S3_CONFIG } from '@/lib/aws/config';
import { parse } from 'mrz';
import { parseUserAgent } from '@/lib/utils/deviceInfo';
import { getIPGeoLocation } from '@/lib/utils/ipGeoLocation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Decode token to get project API key
    // Format: base64(projectId:timestamp:signature)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [projectId] = decoded.split(':');

    // Find project
    const project = await prisma.project.findFirst({
      where: { id: projectId, isActive: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 404 });
    }

    const formData = await request.formData();
    const documentFront = formData.get('documentFront') as File | null;
    const documentBack = formData.get('documentBack') as File | null;
    const selfie = formData.get('selfie') as File | null;

    if (!documentFront || !selfie) {
      return NextResponse.json(
        { error: 'Document front and selfie are required' },
        { status: 400 }
      );
    }

    // Get IP and User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Parse device info
    const deviceInfo = userAgent ? parseUserAgent(userAgent) : null;

    // Get IP geolocation (async, don't block)
    const ipGeoPromise = ipAddress !== '127.0.0.1' ? getIPGeoLocation(ipAddress) : null;

    // Check for recent duplicate submissions (within last 5 seconds)
    const recentVerification = await prisma.verification.findFirst({
      where: {
        projectId: project.id,
        status: 'PROCESSING',
        createdAt: {
          gte: new Date(Date.now() - 5000), // Last 5 seconds
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If found a recent processing verification, return it instead of creating duplicate
    if (recentVerification) {
      console.log('Duplicate submission detected, returning existing verification:', recentVerification.id);
      return NextResponse.json({
        verification: {
          id: recentVerification.id,
          status: recentVerification.status,
        },
        message: 'Верификация уже запущена',
      }, { status: 202 });
    }

    // Create verification record
    const verification = await prisma.verification.create({
      data: {
        projectId: project.id,
        status: 'PROCESSING',
        ipAddress,
        userAgent,
        deviceInfo: deviceInfo || undefined,
        sessionEvents: [
          {
            type: 'SESSION_CREATED',
            timestamp: new Date().toISOString(),
            device: deviceInfo,
          }
        ],
      },
    });

    // Save IP geolocation after creation (non-blocking)
    if (ipGeoPromise) {
      ipGeoPromise.then(async (ipGeo) => {
        await prisma.verification.update({
          where: { id: verification.id },
          data: { ipGeoLocation: ipGeo },
        });
      }).catch(err => console.error('Failed to save IP geo:', err));
    }

    // Start async processing
    processVerification(verification.id, project, documentFront, documentBack, selfie, ipAddress)
      .catch(err => console.error('Verification processing error:', err));

    return NextResponse.json({
      verification: {
        id: verification.id,
        status: verification.status,
      },
      message: 'Верификация запущена',
    }, { status: 202 });
  } catch (error) {
    console.error('Public verify error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    );
  }
}

async function processVerification(
  verificationId: string,
  project: any,
  documentFront: File,
  documentBack: File | null,
  selfie: File,
  ipAddress: string
) {
  try {
    // Upload files to S3 with encryption
    const [docFrontResult, docBackResult, selfieResult] = await Promise.all([
      uploadFile(
        Buffer.from(await documentFront.arrayBuffer()),
        documentFront.name,
        { folder: `verifications/${verificationId}`, contentType: documentFront.type, encrypt: true }
      ),
      documentBack ? uploadFile(
        Buffer.from(await documentBack.arrayBuffer()),
        documentBack.name,
        { folder: `verifications/${verificationId}`, contentType: documentBack.type, encrypt: true }
      ) : null,
      uploadFile(
        Buffer.from(await selfie.arrayBuffer()),
        selfie.name,
        { folder: `verifications/${verificationId}`, contentType: selfie.type, encrypt: true }
      ),
    ]);

    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        documentFrontS3Key: docFrontResult.key,
        documentBackS3Key: docBackResult?.key,
        selfieS3Key: selfieResult.key,
      },
    });

    // OCR
    const ocrResult = await analyzeID(S3_CONFIG.bucket, docFrontResult.key);

    console.log('OCR Result:', JSON.stringify(ocrResult, null, 2));

    // Parse MRZ
    let mrzParsed: any = null;
    const CONFIDENCE_THRESHOLD = 70;

    // Helper function to check if value is valid (not null, not empty string)
    const isValidValue = (value: any) => value && value.trim && value.trim() !== '';

    // Helper function to parse date in DD.MM.YYYY format
    const parseDate = (dateStr: string): string | null => {
      if (!dateStr) return null;

      // Try DD.MM.YYYY format (common in Kazakhstan/Russia IDs)
      const ddmmyyyyMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        return `${year}-${month}-${day}`;
      }

      // Try YYYY-MM-DD format (already correct)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Try other formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      return null;
    };

    let finalFirstName = (ocrResult.personalInfo['FIRST_NAME']?.confidence > CONFIDENCE_THRESHOLD &&
      isValidValue(ocrResult.personalInfo['FIRST_NAME']?.value))
      ? ocrResult.personalInfo['FIRST_NAME']?.value : null;
    let finalLastName = (ocrResult.personalInfo['LAST_NAME']?.confidence > CONFIDENCE_THRESHOLD &&
      isValidValue(ocrResult.personalInfo['LAST_NAME']?.value))
      ? ocrResult.personalInfo['LAST_NAME']?.value : null;
    let finalDateOfBirth = (ocrResult.personalInfo['DATE_OF_BIRTH']?.confidence > CONFIDENCE_THRESHOLD &&
      isValidValue(ocrResult.personalInfo['DATE_OF_BIRTH']?.value))
      ? parseDate(ocrResult.personalInfo['DATE_OF_BIRTH']?.value) : null;
    let finalDocumentNumber = (ocrResult.personalInfo['DOCUMENT_NUMBER']?.confidence > CONFIDENCE_THRESHOLD &&
      isValidValue(ocrResult.personalInfo['DOCUMENT_NUMBER']?.value))
      ? ocrResult.personalInfo['DOCUMENT_NUMBER']?.value : null;
    let finalNationality = (ocrResult.personalInfo['NATIONALITY']?.confidence > CONFIDENCE_THRESHOLD &&
      isValidValue(ocrResult.personalInfo['NATIONALITY']?.value))
      ? ocrResult.personalInfo['NATIONALITY']?.value : null;

    if (ocrResult.personalInfo['MRZ_CODE']?.value && isValidValue(ocrResult.personalInfo['MRZ_CODE']?.value)) {
      try {
        const mrzCode = ocrResult.personalInfo['MRZ_CODE'].value;
        const lines = mrzCode.split('\n').map(l => l.trim());

        if (lines.length >= 2) {
          const line1 = lines[0];
          const namePart = line1.substring(5);
          const [lastName, ...firstNameParts] = namePart.split('<<');

          if (lastName) finalLastName = lastName.replace(/</g, '').trim();
          if (firstNameParts.length > 0) {
            finalFirstName = firstNameParts.join(' ').replace(/</g, '').trim();
          }

          const line2 = lines[1];
          const docNum = line2.substring(0, 9).replace(/</g, '').trim();
          if (docNum) finalDocumentNumber = docNum;

          const nationality = line2.substring(10, 13);
          if (nationality) finalNationality = nationality;

          const birthDateStr = line2.substring(13, 19);
          if (birthDateStr && /^\d{6}$/.test(birthDateStr)) {
            const yy = parseInt(birthDateStr.substring(0, 2));
            const mm = birthDateStr.substring(2, 4);
            const dd = birthDateStr.substring(4, 6);
            const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;
            finalDateOfBirth = `${yyyy}-${mm}-${dd}`;
          }
        }

        mrzParsed = parse(mrzCode);
        if (mrzParsed.valid) {
          if (!finalFirstName) finalFirstName = mrzParsed.fields.firstName;
          if (!finalLastName) finalLastName = mrzParsed.fields.lastName;
          if (!finalDocumentNumber) finalDocumentNumber = mrzParsed.fields.documentNumber;
          if (!finalNationality) finalNationality = mrzParsed.fields.nationality;
        }
      } catch (mrzError) {
        console.error('MRZ parsing error:', mrzError);
      }
    }

    // Face detection and liveness check
    const faceDetection = await detectFaces(S3_CONFIG.bucket, selfieResult.key);

    if (faceDetection.faceCount === 0) {
      await failVerification(verificationId, 'Лицо не обнаружено на селфи', project);
      return;
    }

    if (faceDetection.faceCount > 1) {
      await failVerification(verificationId, 'Обнаружено несколько лиц на селфи', project);
      return;
    }

    // Calculate liveness score from face quality attributes
    const { calculateLivenessScore } = await import('@/lib/aws/rekognition');
    const livenessScore = calculateLivenessScore(faceDetection.faces);
    const livenessConfidence = faceDetection.faces[0]?.Confidence || 0;

    console.log(`Liveness score calculated: ${livenessScore}, confidence: ${livenessConfidence}`);

    // Face comparison
    const faceComparison = await compareFaces(
      S3_CONFIG.bucket,
      docFrontResult.key,
      S3_CONFIG.bucket,
      selfieResult.key,
      85
    );

    // Fraud detection
    const fraudCheck = await checkFraud({
      verificationId,
      email: 'public-verification@example.com',
      ipAddress: ipAddress || '127.0.0.1',
      documentNumber: finalDocumentNumber,
      firstName: finalFirstName,
      lastName: finalLastName,
      dateOfBirth: finalDateOfBirth,
      faceMatchScore: faceComparison.similarity,
      livenessScore,
    });

    // Determine status
    let finalStatus: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' = 'APPROVED';
    let rejectionReason: string | undefined;

    if (!faceComparison.isMatch) {
      finalStatus = 'REJECTED';
      rejectionReason = 'Лицо не совпадает с фотографией в документе';
    } else if (fraudCheck.riskLevel === 'HIGH') {
      finalStatus = 'REJECTED';
      rejectionReason = 'Обнаружен высокий риск мошенничества';
    } else if (fraudCheck.riskLevel === 'MEDIUM') {
      finalStatus = 'MANUAL_REVIEW';
    } else if (faceComparison.similarity < 90) {
      finalStatus = 'MANUAL_REVIEW';
    }

    // Update verification
    const updatedVerification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: finalStatus,
        ocrData: ocrResult.personalInfo,
        mrzData: mrzParsed ? {
          ...ocrResult.mrzData,
          parsed: mrzParsed.fields,
          valid: mrzParsed.valid,
        } : ocrResult.mrzData,
        faceMatchScore: faceComparison.similarity,
        faceMatchConfidence: faceComparison.confidence,
        livenessScore,
        livenessConfidence,
        fraudScore: fraudCheck.fraudScore,
        fraudRiskLevel: fraudCheck.riskLevel,
        fraudReasons: fraudCheck.reasons,
        completedAt: new Date(),
        firstName: finalFirstName || null,
        lastName: finalLastName || null,
        dateOfBirth: finalDateOfBirth ? new Date(finalDateOfBirth) : null,
        documentNumber: finalDocumentNumber || null,
        nationality: finalNationality || null,
        rejectionReason,
      },
    });

    // Send webhook
    if (project.webhookUrl && project.webhookSecret) {
      await sendWebhook(
        project.webhookUrl,
        project.webhookSecret,
        {
          event: 'verification.completed',
          verificationId: updatedVerification.id,
          status: updatedVerification.status,
          data: {
            status: updatedVerification.status,
            faceMatchScore: updatedVerification.faceMatchScore,
            fraudScore: updatedVerification.fraudScore,
            fraudRiskLevel: updatedVerification.fraudRiskLevel,
          },
          timestamp: new Date().toISOString(),
        }
      );
    }

    await createAuditLog({
      userId: project.userId,
      verificationId,
      action: 'VERIFICATION_COMPLETED',
      details: { status: finalStatus, fraudScore: fraudCheck.fraudScore },
    });
  } catch (error) {
    console.error('Verification processing error:', error);
    await failVerification(verificationId, `Processing failed: ${error}`, project);
  }
}

async function failVerification(verificationId: string, reason: string, project: any) {
  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      completedAt: new Date(),
    },
  });

  if (project.webhookUrl && project.webhookSecret) {
    await sendWebhook(
      project.webhookUrl,
      project.webhookSecret,
      {
        event: 'verification.failed',
        verificationId,
        status: 'REJECTED',
        data: { reason },
        timestamp: new Date().toISOString(),
      }
    );
  }
}
