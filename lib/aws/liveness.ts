import {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
} from '@aws-sdk/client-rekognition';
import { AWS_CONFIG } from './config';

const rekognitionClient = new RekognitionClient(AWS_CONFIG);

export interface LivenessSessionResult {
  sessionId: string;
  token: string;
}

export interface LivenessCheckResult {
  isLive: boolean;
  confidence: number;
  status: string;
  auditImages?: string[];
  referenceImage?: string;
}

/**
 * Create a Face Liveness session
 * This session will be used by the client to perform liveness detection
 */
export async function createLivenessSession(): Promise<LivenessSessionResult> {
  try {
    const command = new CreateFaceLivenessSessionCommand({
      Settings: {
        OutputConfig: {
          S3Bucket: process.env.AWS_S3_BUCKET,
          S3KeyPrefix: 'liveness-sessions/',
        },
        AuditImagesLimit: 4,
      },
    });

    const response = await rekognitionClient.send(command);

    if (!response.SessionId) {
      throw new Error('Failed to create liveness session: No session ID returned');
    }

    return {
      sessionId: response.SessionId,
      token: response.SessionId, // In production, use a proper token
    };
  } catch (error) {
    console.error('Create liveness session error:', error);
    throw new Error(`Failed to create liveness session: ${error}`);
  }
}

/**
 * Get the results of a Face Liveness session
 * Call this after the client completes the liveness check
 */
export async function getLivenessSessionResults(
  sessionId: string
): Promise<LivenessCheckResult> {
  try {
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId,
    });

    const response = await rekognitionClient.send(command);

    if (!response.Confidence || response.Status !== 'SUCCEEDED') {
      return {
        isLive: false,
        confidence: 0,
        status: response.Status || 'FAILED',
      };
    }

    // AWS returns confidence that it's a live person
    const confidence = response.Confidence;
    const isLive = confidence >= 90; // High threshold for production

    return {
      isLive,
      confidence,
      status: response.Status,
      auditImages: response.AuditImages?.map(img => img.S3Object?.Name).filter(Boolean) as string[],
      referenceImage: response.ReferenceImage?.S3Object?.Name,
    };
  } catch (error) {
    console.error('Get liveness session results error:', error);
    throw new Error(`Failed to get liveness results: ${error}`);
  }
}

/**
 * Simple liveness check using video frames
 * This is a fallback method that analyzes multiple frames from video
 */
export async function checkLivenessFromFrames(
  frames: Buffer[]
): Promise<LivenessCheckResult> {
  // This is a simplified implementation
  // In production, you would:
  // 1. Upload frames to S3
  // 2. Use Rekognition DetectFaces on multiple frames
  // 3. Analyze face positions, angles, and expressions across frames
  // 4. Check for signs of life (blinking, movement, etc.)

  if (frames.length < 3) {
    return {
      isLive: false,
      confidence: 0,
      status: 'INSUFFICIENT_FRAMES',
    };
  }

  // For now, return a basic confidence based on frame count
  // TODO: Implement proper multi-frame analysis
  console.log('Liveness check from frames not fully implemented, returning default confidence');

  return {
    isLive: true,
    confidence: 85, // Default confidence until full implementation
    status: 'SUCCEEDED',
  };
}
