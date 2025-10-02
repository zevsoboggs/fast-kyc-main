import {
  RekognitionClient,
  CompareFacesCommand,
  DetectFacesCommand,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
} from '@aws-sdk/client-rekognition';
import { AWS_CONFIG } from './config';

const rekognitionClient = new RekognitionClient(AWS_CONFIG);

export interface FaceComparisonResult {
  isMatch: boolean;
  similarity: number;
  confidence: number;
  faceMatches: any[];
}

export interface LivenessResult {
  isLive: boolean;
  confidence: number;
  auditImages: string[];
  sessionId: string;
}

export async function compareFaces(
  sourceS3Bucket: string,
  sourceS3Key: string,
  targetS3Bucket: string,
  targetS3Key: string,
  similarityThreshold: number = 90
): Promise<FaceComparisonResult> {
  try {
    const command = new CompareFacesCommand({
      SourceImage: {
        S3Object: {
          Bucket: sourceS3Bucket,
          Name: sourceS3Key,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: targetS3Bucket,
          Name: targetS3Key,
        },
      },
      SimilarityThreshold: similarityThreshold,
    });

    const response = await rekognitionClient.send(command);

    const isMatch = (response.FaceMatches?.length ?? 0) > 0;
    const similarity = response.FaceMatches?.[0]?.Similarity ?? 0;
    const confidence = response.FaceMatches?.[0]?.Face?.Confidence ?? 0;

    return {
      isMatch,
      similarity,
      confidence,
      faceMatches: response.FaceMatches || [],
    };
  } catch (error) {
    console.error('Face comparison error:', error);
    throw new Error(`Failed to compare faces: ${error}`);
  }
}

export async function detectFaces(s3Bucket: string, s3Key: string) {
  try {
    const command = new DetectFacesCommand({
      Image: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key,
        },
      },
      Attributes: ['ALL'],
    });

    const response = await rekognitionClient.send(command);

    return {
      faceCount: response.FaceDetails?.length || 0,
      faces: response.FaceDetails || [],
    };
  } catch (error) {
    console.error('Face detection error:', error);
    throw new Error(`Failed to detect faces: ${error}`);
  }
}

/**
 * Calculate liveness score based on face quality attributes
 * This is a simplified liveness detection using face quality metrics
 */
export function calculateLivenessScore(faceDetails: any): number {
  if (!faceDetails || faceDetails.length === 0) {
    return 0;
  }

  const face = faceDetails[0];
  let score = 0;
  let checks = 0;

  // Check face quality metrics
  if (face.Quality) {
    // Brightness (should be good, not too dark or bright)
    if (face.Quality.Brightness !== undefined) {
      const brightness = face.Quality.Brightness;
      if (brightness >= 40 && brightness <= 85) {
        score += 20;
      } else if (brightness >= 30 && brightness <= 95) {
        score += 10;
      }
      checks++;
    }

    // Sharpness (higher is better - photo of photo is usually blurry)
    if (face.Quality.Sharpness !== undefined) {
      const sharpness = face.Quality.Sharpness;
      if (sharpness >= 80) {
        score += 20;
      } else if (sharpness >= 60) {
        score += 15;
      } else if (sharpness >= 40) {
        score += 10;
      }
      checks++;
    }
  }

  // Check if eyes are open (photo of photo usually has closed or unclear eyes)
  if (face.EyesOpen) {
    if (face.EyesOpen.Value === true && face.EyesOpen.Confidence > 90) {
      score += 15;
    } else if (face.EyesOpen.Value === true) {
      score += 10;
    }
    checks++;
  }

  // Check if mouth is closed or open (natural expression)
  if (face.MouthOpen) {
    if (face.MouthOpen.Confidence > 80) {
      score += 10;
    }
    checks++;
  }

  // Check pose (frontal face is expected, not angled)
  if (face.Pose) {
    const { Pitch, Roll, Yaw } = face.Pose;
    const isPitchGood = Math.abs(Pitch || 0) < 15;
    const isRollGood = Math.abs(Roll || 0) < 15;
    const isYawGood = Math.abs(Yaw || 0) < 15;

    if (isPitchGood && isRollGood && isYawGood) {
      score += 20;
    } else if (isPitchGood && isRollGood) {
      score += 15;
    } else if (isPitchGood || isRollGood) {
      score += 10;
    }
    checks++;
  }

  // Check confidence of face detection itself
  if (face.Confidence !== undefined) {
    if (face.Confidence >= 99) {
      score += 15;
    } else if (face.Confidence >= 95) {
      score += 10;
    } else if (face.Confidence >= 90) {
      score += 5;
    }
    checks++;
  }

  // Return normalized score (0-100)
  return checks > 0 ? Math.min(Math.round(score), 100) : 0;
}

export async function createLivenessSession(): Promise<string> {
  try {
    const command = new CreateFaceLivenessSessionCommand({
      Settings: {
        OutputConfig: {
          S3Bucket: process.env.AWS_S3_BUCKET,
        },
        AuditImagesLimit: 4,
      },
    });

    const response = await rekognitionClient.send(command);
    return response.SessionId || '';
  } catch (error) {
    console.error('Liveness session creation error:', error);
    throw new Error(`Failed to create liveness session: ${error}`);
  }
}

export async function getLivenessSessionResults(sessionId: string): Promise<LivenessResult> {
  try {
    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId,
    });

    const response = await rekognitionClient.send(command);

    const isLive = response.Status === 'SUCCEEDED';
    const confidence = response.Confidence ?? 0;
    const auditImages = response.AuditImages?.map(img => img.S3Object?.Name || '') || [];

    return {
      isLive,
      confidence,
      auditImages,
      sessionId,
    };
  } catch (error) {
    console.error('Liveness session results error:', error);
    throw new Error(`Failed to get liveness results: ${error}`);
  }
}