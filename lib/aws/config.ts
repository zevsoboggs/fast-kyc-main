export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

export const S3_CONFIG = {
  bucket: process.env.AWS_S3_BUCKET || 'kyc-documents-bucket',
  kmsKeyId: process.env.AWS_KMS_KEY_ID || '',
};

export const FRAUD_DETECTOR_CONFIG = {
  detectorId: process.env.AWS_FRAUD_DETECTOR_ID || 'kyc_fraud_detector',
  eventTypeName: process.env.AWS_FRAUD_EVENT_TYPE || 'kyc_verification',
  enabled: process.env.AWS_FRAUD_DETECTOR_ENABLED === 'true',
};