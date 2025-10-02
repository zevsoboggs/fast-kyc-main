import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function generateApiKey(): string {
  // Generate a readable API key with prefix
  const prefix = 'sk_live';
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomPart}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return await bcrypt.hash(apiKey, 10);
}

export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(apiKey, hash);
}

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

export function signWebhookPayload(payload: any, secret: string): string {
  const timestamp = Date.now();
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const [timestampPart, signaturePart] = signature.split(',');
    const timestamp = timestampPart.split('=')[1];
    const receivedSignature = signaturePart.split('=')[1];

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return receivedSignature === expectedSignature;
  } catch (error) {
    return false;
  }
}