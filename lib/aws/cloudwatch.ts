import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { AWS_CONFIG } from './config';

const cloudwatchClient = new CloudWatchLogsClient(AWS_CONFIG);

const LOG_GROUP_NAME = '/aws/kyc-service';
let logGroupExists: boolean | null = null;

export interface LogEntry {
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  verificationId?: string;
}

export async function logToCloudWatch(entry: LogEntry): Promise<void> {
  try {
    // Check if log group exists (cached result)
    if (logGroupExists === null) {
      logGroupExists = await checkLogGroupExists();
    }

    if (!logGroupExists) {
      // Silently fall back to console logging if log group doesn't exist
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${entry.level}] ${entry.message}`, entry.metadata || '');
      }
      return;
    }

    const logStreamName = `${entry.level.toLowerCase()}-${new Date().toISOString().split('T')[0]}`;

    // Ensure log stream exists
    await ensureLogStream(logStreamName);

    const logEvent = {
      message: JSON.stringify({
        timestamp: new Date().toISOString(),
        level: entry.level,
        message: entry.message,
        metadata: entry.metadata,
        userId: entry.userId,
        verificationId: entry.verificationId,
      }),
      timestamp: Date.now(),
    };

    const command = new PutLogEventsCommand({
      logGroupName: LOG_GROUP_NAME,
      logStreamName,
      logEvents: [logEvent],
    });

    await cloudwatchClient.send(command);
  } catch (error) {
    // Fallback to console if CloudWatch fails
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.level}] ${entry.message}`, entry.metadata || '');
    }
  }
}

async function checkLogGroupExists(): Promise<boolean> {
  try {
    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: LOG_GROUP_NAME,
    });

    const response = await cloudwatchClient.send(command);
    return response.logGroups?.some(group => group.logGroupName === LOG_GROUP_NAME) || false;
  } catch (error) {
    return false;
  }
}

async function ensureLogStream(logStreamName: string): Promise<void> {
  try {
    const describeCommand = new DescribeLogStreamsCommand({
      logGroupName: LOG_GROUP_NAME,
      logStreamNamePrefix: logStreamName,
    });

    const response = await cloudwatchClient.send(describeCommand);

    if (!response.logStreams || response.logStreams.length === 0) {
      const createCommand = new CreateLogStreamCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName,
      });

      await cloudwatchClient.send(createCommand);
    }
  } catch (error) {
    // Log stream might already exist
    throw error;
  }
}

export async function logInfo(message: string, metadata?: Record<string, any>): Promise<void> {
  await logToCloudWatch({
    level: 'INFO',
    message,
    metadata,
  });
}

export async function logError(message: string, error: Error, metadata?: Record<string, any>): Promise<void> {
  await logToCloudWatch({
    level: 'ERROR',
    message,
    metadata: {
      ...metadata,
      error: error.message,
      stack: error.stack,
    },
  });
}

export async function logWarning(message: string, metadata?: Record<string, any>): Promise<void> {
  await logToCloudWatch({
    level: 'WARN',
    message,
    metadata,
  });
}