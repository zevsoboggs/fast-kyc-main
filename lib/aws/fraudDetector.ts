import {
  FraudDetectorClient,
  GetEventPredictionCommand,
} from '@aws-sdk/client-frauddetector';
import { AWS_CONFIG, FRAUD_DETECTOR_CONFIG } from './config';

const fraudDetectorClient = new FraudDetectorClient(AWS_CONFIG);

export interface FraudCheckInput {
  verificationId: string;
  email: string;
  ipAddress: string;
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  faceMatchScore?: number;
  livenessScore?: number;
}

export interface FraudCheckResult {
  fraudScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  modelScores: Record<string, number>;
}

export async function checkFraud(input: FraudCheckInput): Promise<FraudCheckResult> {
  try {
    // Calculate rule-based score as baseline
    const ruleBasedScore = calculateFraudScore(input);
    const ruleBasedRiskLevel = determineRiskLevel(ruleBasedScore);
    const ruleBasedReasons = identifyFraudReasons(input, ruleBasedScore);

    // If AWS Fraud Detector is enabled, use it
    if (FRAUD_DETECTOR_CONFIG.enabled) {
      try {
        console.log('Using AWS Fraud Detector for verification:', input.verificationId);

        const command = new GetEventPredictionCommand({
          detectorId: FRAUD_DETECTOR_CONFIG.detectorId,
          eventId: input.verificationId,
          eventTypeName: FRAUD_DETECTOR_CONFIG.eventTypeName,
          entities: [
            {
              entityType: 'customer',
              entityId: input.email || input.verificationId,
            },
          ],
          eventTimestamp: new Date().toISOString(),
          eventVariables: {
            email: input.email || 'unknown',
            ip_address: input.ipAddress || 'unknown',
            document_number: input.documentNumber || '',
            first_name: input.firstName || '',
            last_name: input.lastName || '',
            date_of_birth: input.dateOfBirth || '',
            face_match_score: input.faceMatchScore?.toString() || '0',
            liveness_score: input.livenessScore?.toString() || '0',
          },
        });

        const response = await fraudDetectorClient.send(command);

        // Process AWS Fraud Detector response
        const modelScores = response.modelScores?.reduce((acc, score) => {
          acc[score.modelVersion?.modelId || 'default'] = score.scores?.[0] || 0;
          return acc;
        }, {} as Record<string, number>) || {};

        // Get primary fraud score from AWS
        const awsFraudScore = Object.values(modelScores)[0] || ruleBasedScore;

        // Get risk level from rule outcomes
        let awsRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = ruleBasedRiskLevel;
        if (response.ruleResults && response.ruleResults.length > 0) {
          const outcomes = response.ruleResults[0]?.outcomes || [];
          if (outcomes.includes('approve')) awsRiskLevel = 'LOW';
          else if (outcomes.includes('review')) awsRiskLevel = 'MEDIUM';
          else if (outcomes.includes('block')) awsRiskLevel = 'HIGH';
        }

        // Get reasons from rule results
        const awsReasons = response.ruleResults?.map(r => r.ruleId || '').filter(Boolean) || [];

        console.log('AWS Fraud Detector result:', {
          fraudScore: awsFraudScore,
          riskLevel: awsRiskLevel,
          reasons: awsReasons,
        });

        return {
          fraudScore: awsFraudScore,
          riskLevel: awsRiskLevel,
          reasons: awsReasons.length > 0 ? awsReasons : ruleBasedReasons,
          modelScores: { ...modelScores, 'rule_based': ruleBasedScore },
        };
      } catch (awsError) {
        console.error('AWS Fraud Detector error, falling back to rule-based:', awsError);
        // Fall through to rule-based detection
      }
    }

    // Use rule-based detection as fallback
    console.log('Using rule-based fraud detection for verification:', input.verificationId);
    return {
      fraudScore: ruleBasedScore,
      riskLevel: ruleBasedRiskLevel,
      reasons: ruleBasedReasons,
      modelScores: { 'rule_based': ruleBasedScore },
    };
  } catch (error) {
    console.error('Fraud detection error:', error);

    // Final fallback to rule-based detection
    const fraudScore = calculateFraudScore(input);
    return {
      fraudScore,
      riskLevel: determineRiskLevel(fraudScore),
      reasons: identifyFraudReasons(input, fraudScore),
      modelScores: { 'fallback': fraudScore },
    };
  }
}

function calculateFraudScore(input: FraudCheckInput): number {
  let score = 0;

  // Face match score check (lower is more suspicious)
  if (input.faceMatchScore !== undefined) {
    if (input.faceMatchScore < 60) {
      score += 50; // Very suspicious
    } else if (input.faceMatchScore < 70) {
      score += 40;
    } else if (input.faceMatchScore < 80) {
      score += 25;
    } else if (input.faceMatchScore < 90) {
      score += 10; // Slightly suspicious
    }
  } else {
    // No face match performed - very suspicious
    score += 45;
  }

  // Liveness score check (lower is more suspicious)
  if (input.livenessScore !== undefined) {
    if (input.livenessScore === 0) {
      // Liveness not performed - add moderate risk
      score += 20;
    } else if (input.livenessScore < 60) {
      score += 35;
    } else if (input.livenessScore < 70) {
      score += 25;
    } else if (input.livenessScore < 85) {
      score += 15;
    }
  }

  // IP address checks
  if (input.ipAddress && input.ipAddress !== '127.0.0.1' && input.ipAddress !== 'unknown') {
    // Check for Tor exit nodes (simple pattern check)
    if (input.ipAddress.includes('onion') || input.ipAddress.includes('tor')) {
      score += 30;
    }

    // Check for private/local IPs being reported (suspicious)
    if (input.ipAddress.startsWith('10.') ||
        input.ipAddress.startsWith('192.168.') ||
        input.ipAddress.startsWith('172.16.')) {
      score += 15;
    }
  } else if (!input.ipAddress || input.ipAddress === 'unknown') {
    // No IP address - moderately suspicious
    score += 10;
  }

  // Email domain check
  if (input.email) {
    const domain = input.email.split('@')[1];
    const suspiciousDomains = [
      'tempmail.com', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email', 'temp-mail.org',
      'trashmail.com', 'dispostable.com'
    ];
    if (suspiciousDomains.some(d => domain?.includes(d))) {
      score += 30;
    }

    // Check for very new or suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (suspiciousTLDs.some(tld => domain?.endsWith(tld))) {
      score += 20;
    }
  } else {
    // No email - moderately suspicious
    score += 15;
  }

  // Document number check
  if (!input.documentNumber || input.documentNumber.length < 5) {
    score += 10; // Missing or invalid document number
  }

  // Name checks
  if (!input.firstName || !input.lastName) {
    score += 15; // Missing name information
  } else {
    // Check for suspicious patterns in names
    const suspiciousPatterns = ['test', 'admin', 'user', 'demo', 'xxx', '123'];
    const fullName = (input.firstName + input.lastName).toLowerCase();
    if (suspiciousPatterns.some(pattern => fullName.includes(pattern))) {
      score += 20;
    }
  }

  // Date of birth check
  if (input.dateOfBirth) {
    try {
      const dob = new Date(input.dateOfBirth);
      const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (age < 18) {
        score += 25; // Underage
      } else if (age > 100) {
        score += 30; // Unrealistic age
      }
    } catch (e) {
      score += 10; // Invalid date format
    }
  }

  return Math.min(score, 100);
}

function determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score < 30) return 'LOW';
  if (score < 60) return 'MEDIUM';
  return 'HIGH';
}

function identifyFraudReasons(input: FraudCheckInput, score: number): string[] {
  const reasons: string[] = [];

  // Face match issues
  if (input.faceMatchScore !== undefined) {
    if (input.faceMatchScore < 60) {
      reasons.push('Критически низкое совпадение лиц');
    } else if (input.faceMatchScore < 80) {
      reasons.push('Низкая уверенность совпадения лиц');
    } else if (input.faceMatchScore < 90) {
      reasons.push('Умеренная уверенность совпадения лиц');
    }
  } else {
    reasons.push('Сравнение лиц не выполнено');
  }

  // Liveness concerns
  if (input.livenessScore !== undefined) {
    if (input.livenessScore === 0) {
      reasons.push('Проверка живости не выполнена');
    } else if (input.livenessScore < 70) {
      reasons.push('Низкий показатель живости (возможное фото с экрана)');
    } else if (input.livenessScore < 85) {
      reasons.push('Проблемы с проверкой живости');
    }
  }

  // IP address issues
  if (input.ipAddress) {
    if (input.ipAddress.includes('onion') || input.ipAddress.includes('tor')) {
      reasons.push('Использование Tor или анонимизирующих сервисов');
    }
    if (input.ipAddress.startsWith('10.') || input.ipAddress.startsWith('192.168.')) {
      reasons.push('Подозрительный IP адрес (локальная сеть)');
    }
  } else {
    reasons.push('IP адрес не определен');
  }

  // Email issues
  if (input.email) {
    const domain = input.email.split('@')[1];
    const suspiciousDomains = [
      'tempmail.com', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email', 'temp-mail.org'
    ];
    if (suspiciousDomains.some(d => domain?.includes(d))) {
      reasons.push('Временный или одноразовый email адрес');
    }

    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (suspiciousTLDs.some(tld => domain?.endsWith(tld))) {
      reasons.push('Подозрительное доменное имя');
    }
  }

  // Document issues
  if (!input.documentNumber || input.documentNumber.length < 5) {
    reasons.push('Отсутствующий или недействительный номер документа');
  }

  // Name issues
  if (!input.firstName || !input.lastName) {
    reasons.push('Неполные данные о имени');
  } else {
    const suspiciousPatterns = ['test', 'admin', 'user', 'demo', 'xxx', '123'];
    const fullName = (input.firstName + input.lastName).toLowerCase();
    if (suspiciousPatterns.some(pattern => fullName.includes(pattern))) {
      reasons.push('Подозрительные данные в имени');
    }
  }

  // Age issues
  if (input.dateOfBirth) {
    try {
      const dob = new Date(input.dateOfBirth);
      const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (age < 18) {
        reasons.push('Пользователь младше 18 лет');
      } else if (age > 100) {
        reasons.push('Нереалистичная дата рождения');
      }
    } catch (e) {
      reasons.push('Некорректный формат даты рождения');
    }
  }

  // Overall risk
  if (score >= 60) {
    reasons.push('Высокий общий балл риска мошенничества');
  } else if (score >= 40) {
    reasons.push('Умеренный общий балл риска');
  }

  return reasons.length > 0 ? reasons : ['Нет выявленных факторов риска'];
}
