import { signWebhookPayload } from './apiKey';

export interface WebhookPayload {
  event: string;
  verificationId: string;
  status: string;
  data: any;
  timestamp: string;
}

export async function sendWebhook(
  webhookUrl: string,
  webhookSecret: string,
  payload: WebhookPayload
): Promise<boolean> {
  try {
    const signature = signWebhookPayload(payload, webhookSecret);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KYC-Signature': signature,
        'User-Agent': 'KYC-Service/1.0',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook delivery failed:', error);
    return false;
  }
}
