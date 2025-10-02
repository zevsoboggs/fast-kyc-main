import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
} from '@aws-sdk/client-sfn';
import { AWS_CONFIG } from './config';

const sfnClient = new SFNClient(AWS_CONFIG);

export interface VerificationWorkflowInput {
  verificationId: string;
  projectId: string;
  documentFrontKey: string;
  documentBackKey?: string;
  selfieKey: string;
  s3Bucket: string;
}

export interface WorkflowStatus {
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED';
  output?: any;
  error?: string;
}

export async function startVerificationWorkflow(
  input: VerificationWorkflowInput
): Promise<{ executionArn: string }> {
  try {
    // Note: This requires a Step Functions state machine to be created in AWS
    // The state machine ARN should be configured in environment variables
    const stateMachineArn = process.env.AWS_STEP_FUNCTION_ARN;

    if (!stateMachineArn) {
      throw new Error('Step Functions ARN not configured');
    }

    const command = new StartExecutionCommand({
      stateMachineArn,
      input: JSON.stringify(input),
      name: `kyc-verification-${input.verificationId}`,
    });

    const response = await sfnClient.send(command);

    return {
      executionArn: response.executionArn || '',
    };
  } catch (error) {
    console.error('Step Functions start error:', error);
    throw new Error(`Failed to start workflow: ${error}`);
  }
}

export async function getWorkflowStatus(executionArn: string): Promise<WorkflowStatus> {
  try {
    const command = new DescribeExecutionCommand({
      executionArn,
    });

    const response = await sfnClient.send(command);

    return {
      status: response.status as any,
      output: response.output ? JSON.parse(response.output) : undefined,
      error: response.error,
    };
  } catch (error) {
    console.error('Step Functions status error:', error);
    throw new Error(`Failed to get workflow status: ${error}`);
  }
}

// Example Step Functions state machine definition (JSON):
/*
{
  "Comment": "KYC Verification Workflow",
  "StartAt": "ExtractDocumentData",
  "States": {
    "ExtractDocumentData": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:TextractOCR",
      "Next": "DetectFaces",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "FailState"
      }]
    },
    "DetectFaces": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:RekognitionFaceDetect",
      "Next": "CompareFaces",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "FailState"
      }]
    },
    "CompareFaces": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:RekognitionFaceCompare",
      "Next": "CheckLiveness",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "FailState"
      }]
    },
    "CheckLiveness": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:RekognitionLiveness",
      "Next": "FraudDetection",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "FailState"
      }]
    },
    "FraudDetection": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:FraudDetector",
      "Next": "MakeDecision",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "FailState"
      }]
    },
    "MakeDecision": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.fraudScore",
          "NumericLessThan": 30,
          "Next": "ApproveVerification"
        },
        {
          "Variable": "$.fraudScore",
          "NumericGreaterThanEquals": 60,
          "Next": "RejectVerification"
        }
      ],
      "Default": "ManualReview"
    },
    "ApproveVerification": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:UpdateVerificationStatus",
      "Parameters": {
        "status": "APPROVED"
      },
      "End": true
    },
    "RejectVerification": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:UpdateVerificationStatus",
      "Parameters": {
        "status": "REJECTED"
      },
      "End": true
    },
    "ManualReview": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:UpdateVerificationStatus",
      "Parameters": {
        "status": "MANUAL_REVIEW"
      },
      "End": true
    },
    "FailState": {
      "Type": "Fail",
      "Error": "VerificationFailed",
      "Cause": "An error occurred during the verification process"
    }
  }
}
*/
