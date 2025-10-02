import { prisma } from '@/lib/db/prisma';
import { AuditAction } from '@/app/generated/prisma';
import { logToCloudWatch } from '@/lib/aws/cloudwatch';

export interface CreateAuditLogInput {
  userId?: string;
  verificationId?: string;
  action: AuditAction;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    // Save to database
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        verificationId: input.verificationId,
        action: input.action,
        details: input.details,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    // Also log to CloudWatch
    await logToCloudWatch({
      level: 'INFO',
      message: `Audit: ${input.action}`,
      metadata: input.details,
      userId: input.userId,
      verificationId: input.verificationId,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
