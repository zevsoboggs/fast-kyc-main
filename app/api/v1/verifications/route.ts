import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, unauthorizedResponse } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { uploadFile } from '@/lib/aws/s3';
import { analyzeID } from '@/lib/aws/textract';
import { compareFaces, detectFaces } from '@/lib/aws/rekognition';
import { checkFraud } from '@/lib/aws/fraudDetector';
import { createAuditLog } from '@/lib/utils/auditLog';
import { sendWebhook } from '@/lib/utils/webhook';
import { S3_CONFIG } from '@/lib/aws/config';
import { z } from 'zod';
import { parse } from 'mrz';
import { parseUserAgent } from '@/lib/utils/deviceInfo';
import { getIPGeoLocation } from '@/lib/utils/ipGeoLocation';

const createVerificationSchema = z.object({
  externalId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  const { project, error } = await authenticateApiKey(request);

  if (error || !project) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const formData = await request.formData();

    const externalId = formData.get('externalId') as string | null;
    const firstName = formData.get('firstName') as string | null;
    const lastName = formData.get('lastName') as string | null;
    const email = formData.get('email') as string | null;

    const data = {
      externalId: externalId || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || '',
    };

    const validated = createVerificationSchema.parse(data);

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

    // Create verification record
    const verification = await prisma.verification.create({
      data: {
        projectId: project.id,
        externalId: validated.externalId,
        firstName: validated.firstName,
        lastName: validated.lastName,
        status: 'PROCESSING',
        ipAddress,
        userAgent,
        deviceInfo: deviceInfo || undefined,
        metadata: { email: validated.email },
        sessionEvents: [
          {
            type: 'VERIFICATION_STARTED',
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
    processVerification(verification.id, project, documentFront, documentBack, selfie, validated.email || 'no-email@provided.com')
      .catch(err => console.error('Verification processing error:', err));

    // Create audit log
    await createAuditLog({
      userId: project.userId,
      verificationId: verification.id,
      action: 'VERIFICATION_STARTED',
      details: { projectId: project.id },
    });

    return NextResponse.json({
      verification: {
        id: verification.id,
        status: verification.status,
      },
      message: 'Верификация запущена. Вы получите webhook уведомление когда она завершится.',
    }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create verification error:', error);
    return NextResponse.json(
      { error: 'Failed to create verification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { project, error } = await authenticateApiKey(request);

  if (error || !project) {
    return unauthorizedResponse(error || undefined);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status');

    const where: any = { projectId: project.id };
    if (status) {
      where.status = status;
    }

    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where,
        select: {
          id: true,
          externalId: true,
          status: true,
          firstName: true,
          lastName: true,
          documentType: true,
          faceMatchScore: true,
          livenessScore: true,
          fraudScore: true,
          fraudRiskLevel: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.verification.count({ where }),
    ]);

    return NextResponse.json({
      verifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    return NextResponse.json(
      { error: 'Failed to get verifications' },
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
  email: string
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

    // Update with S3 keys
    await prisma.verification.update({
      where: { id: verificationId },
      data: {
        documentFrontS3Key: docFrontResult.key,
        documentBackS3Key: docBackResult?.key,
        selfieS3Key: selfieResult.key,
      },
    });

    // Step 1: OCR - Analyze ID document
    const ocrResult = await analyzeID(S3_CONFIG.bucket, docFrontResult.key);

    console.log('OCR Result:', JSON.stringify(ocrResult, null, 2));

    // Parse MRZ if available for more accurate data
    let mrzParsed: any = null;
    const CONFIDENCE_THRESHOLD = 70; // Minimum confidence to trust OCR field

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

        // Manual MRZ parsing for passport (more reliable than library)
        // Format: P<KAZTOKUSHEV<<DIAS<<<<<<<<<<<<<<<<<<<<<<<<<
        //         N120778099KAZ0009209M2811154000920551217<<44
        const lines = mrzCode.split('\n').map(l => l.trim());

        if (lines.length >= 2) {
          // Line 1: Type + Country + Name
          const line1 = lines[0];
          const namePart = line1.substring(5); // Skip "P<KAZ"
          const [lastName, ...firstNameParts] = namePart.split('<<');

          if (lastName) finalLastName = lastName.replace(/</g, '').trim();
          if (firstNameParts.length > 0) {
            finalFirstName = firstNameParts.join(' ').replace(/</g, '').trim();
          }

          // Line 2: Document number + Nationality + Birth date + Sex + Expiry + Personal number
          const line2 = lines[1];
          // Document number: positions 0-8
          const docNum = line2.substring(0, 9).replace(/</g, '').trim();
          if (docNum) finalDocumentNumber = docNum;

          // Nationality: positions 10-12
          const nationality = line2.substring(10, 13);
          if (nationality) finalNationality = nationality;

          // Birth date: positions 13-18 (YYMMDD)
          const birthDateStr = line2.substring(13, 19);
          if (birthDateStr && /^\d{6}$/.test(birthDateStr)) {
            const yy = parseInt(birthDateStr.substring(0, 2));
            const mm = birthDateStr.substring(2, 4);
            const dd = birthDateStr.substring(4, 6);
            // Assume 20xx for yy < 50, 19xx for yy >= 50
            const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;
            finalDateOfBirth = `${yyyy}-${mm}-${dd}`;
          }
        }

        // Also try library parsing as backup
        mrzParsed = parse(mrzCode);
        if (mrzParsed.valid) {
          // Use library data as fallback if manual parsing failed
          if (!finalFirstName) finalFirstName = mrzParsed.fields.firstName;
          if (!finalLastName) finalLastName = mrzParsed.fields.lastName;
          if (!finalDocumentNumber) finalDocumentNumber = mrzParsed.fields.documentNumber;
          if (!finalNationality) finalNationality = mrzParsed.fields.nationality;
        }

        // Log extracted data for debugging
        console.log('Extracted data:', {
          firstName: finalFirstName,
          lastName: finalLastName,
          dateOfBirth: finalDateOfBirth,
          documentNumber: finalDocumentNumber,
          nationality: finalNationality,
          mrzValid: mrzParsed?.valid
        });
      } catch (mrzError) {
        console.error('MRZ parsing error:', mrzError);
      }
    }

    // Step 2: Face detection on selfie with liveness check
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

    // Step 3: Face comparison
    const faceComparison = await compareFaces(
      S3_CONFIG.bucket,
      docFrontResult.key,
      S3_CONFIG.bucket,
      selfieResult.key,
      85 // Similarity threshold
    );

    // Step 4: Fraud detection
    const fraudCheck = await checkFraud({
      verificationId,
      email,
      ipAddress: '',
      documentNumber: finalDocumentNumber,
      firstName: finalFirstName,
      lastName: finalLastName,
      dateOfBirth: finalDateOfBirth,
      faceMatchScore: faceComparison.similarity,
      livenessScore,
    });

    // Determine final status
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

    // Update verification with results
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

    // Send webhook if configured
    if (project.webhookUrl && project.webhookSecret) {
      await sendWebhook(
        project.webhookUrl,
        project.webhookSecret,
        {
          event: 'verification.completed',
          verificationId: updatedVerification.id,
          status: updatedVerification.status,
          data: {
            externalId: updatedVerification.externalId,
            status: updatedVerification.status,
            faceMatchScore: updatedVerification.faceMatchScore,
            fraudScore: updatedVerification.fraudScore,
            fraudRiskLevel: updatedVerification.fraudRiskLevel,
          },
          timestamp: new Date().toISOString(),
        }
      );
    }

    // Create audit log
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

  // Send webhook
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
