import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 400 });
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
      },
      data: {
        message: 'This is a test webhook from veriffy.me',
      },
    };

    // Generate signature
    const signature = crypto
      .createHmac('sha256', project.webhookSecret || '')
      .update(JSON.stringify(testPayload))
      .digest('hex');

    // Send webhook
    try {
      const webhookResponse = await fetch(project.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'User-Agent': 'veriffy.me-Webhook/1.0',
        },
        body: JSON.stringify(testPayload),
      });

      const success = webhookResponse.ok;
      const statusCode = webhookResponse.status;
      let responseBody = '';

      try {
        responseBody = await webhookResponse.text();
      } catch (e) {
        responseBody = '';
      }

      return NextResponse.json({
        success,
        statusCode,
        message: success ? 'Webhook test successful' : 'Webhook test failed',
        response: {
          statusCode,
          body: responseBody.substring(0, 500), // Limit response body
        },
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: 'Failed to send webhook',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
